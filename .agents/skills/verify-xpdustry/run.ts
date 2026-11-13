import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { text } from "node:stream/consumers";
import type { Browser, BrowserContextOptions, Page } from "playwright";
import { type Engine, evidenceFolder, settle, withBrowser } from "./browser.ts";
import { get, healthyInstance } from "./instance.ts";

interface Visitor {
  width?: number;
  height?: number;
  /** The browser language, sent as Accept-Language. */
  language?: string;
  /** Whether the visitor allows motion. Off by default, so screenshots are of settled pages. */
  motion?: boolean;
  /** Whether the browser runs scripts. Without them the page is what the server sent. */
  scripts?: boolean;
  /** Whether to keep a video of the visit, written to the evidence folder when the run ends. */
  record?: boolean;
}

interface Session {
  base: string;
  browser: Browser;
  evidence: string;
  transcript: string[];
}

const VISITOR = {
  width: 1280,
  height: 800,
  language: "en",
  motion: false,
  scripts: true,
  record: false
};

/** The browser context that makes a visitor. */
function contextOptions(
  chromium: boolean,
  evidence: string,
  visitor: Visitor
): BrowserContextOptions {
  const { width, height, language, motion, scripts, record } = { ...VISITOR, ...visitor };
  return {
    viewport: { width, height },
    locale: language,
    reducedMotion: motion ? "no-preference" : "reduce",
    javaScriptEnabled: scripts,
    recordVideo: record ? { dir: evidence, size: { width, height } } : undefined,
    // Only Chromium has these to grant; Firefox is launched with the clipboard open.
    permissions: chromium ? ["clipboard-read", "clipboard-write"] : []
  };
}

/** What a script sees as its globals; SKILL.md documents each one. */
function scriptHelpers({ base, browser, evidence, transcript }: Session) {
  return {
    base,
    browser,
    evidence,
    /** A fresh visitor with no cookies. */
    async newPage(visitor: Visitor = {}) {
      const chromium = browser.browserType().name() === "chromium";
      // Playwright cannot evaluate in a Firefox page whose scripts are off: every check would hang.
      if (visitor.scripts === false && !chromium) {
        throw new Error("newPage({ scripts: false }) needs Chromium");
      }
      const context = await browser.newContext(contextOptions(chromium, evidence, visitor));
      return context.newPage();
    },
    go: (page: Page, path: string) => settle(page, base + path),
    get: (path: string, headers?: Record<string, string>) => get(base, path, headers),
    /** Save a screenshot and the ARIA tree of what the page shows now. */
    async snap(page: Page, name: string) {
      await page.screenshot({ path: join(evidence, `${name}.png`) });
      const tree = await page.locator("body").ariaSnapshot();
      writeFileSync(
        join(evidence, `${name}.aria.txt`),
        `${page.url()}\n${await page.title()}\n\n${tree}\n`
      );
    },
    save(name: string, content: string | Uint8Array) {
      writeFileSync(join(evidence, name), content);
    },
    print(...values: unknown[]) {
      const line = values
        .map((value) => (typeof value === "string" ? value : JSON.stringify(value)))
        .join(" ");
      console.log(line);
      transcript.push(line);
    }
  };
}

/**
 * Where in the script it failed: its outermost line in the stack, so a check that throws from a
 * helper names the line that called it. The function wrapper puts two lines before the first.
 */
function scriptLine(stack: string): string {
  const where = [...stack.matchAll(/<anonymous>:(\d+):\d+/g)].at(-1)?.[1];
  return where ? ` (line ${Number(where) - 2} of the script)` : "";
}

/** Keeps a screenshot of every open page and the stack, and says which script line failed. */
async function recordFailure(error: unknown, { browser, evidence, transcript }: Session) {
  const pages = browser.contexts().flatMap((context) => context.pages());
  for (const [index, page] of pages.entries()) {
    await page.screenshot({ path: join(evidence, `failure-${index + 1}.png`) }).catch(() => {});
  }
  const [stack, message] =
    error instanceof Error
      ? [error.stack ?? error.message, error.message.split("\n")[0]]
      : [String(error), String(error)];
  transcript.push(stack);
  console.error(`verify: the script failed${scriptLine(stack)}: ${message}`);
  console.error("verify: the page at that moment is in failure-*.png, the trace in output.txt");
}

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

export async function run(label: string, engine: Engine) {
  const { base } = healthyInstance();
  const evidence = evidenceFolder(label);
  const code = await text(process.stdin);
  writeFileSync(join(evidence, "drive.js"), code);

  await withBrowser(async (browser) => {
    const session: Session = { base, browser, evidence, transcript: [] };
    const helpers = scriptHelpers(session);
    const drive = new AsyncFunction(`{ ${Object.keys(helpers).join(", ")} }`, code);
    try {
      await drive(helpers);
    } catch (error) {
      await recordFailure(error, session);
      process.exitCode = 1;
    } finally {
      writeFileSync(join(evidence, "output.txt"), `${session.transcript.join("\n")}\n`);
      await Promise.all(browser.contexts().map((context) => context.close()));
      console.log(`evidence: ${evidence}`);
    }
  }, engine);
}
