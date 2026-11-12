import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { text } from "node:stream/consumers";
import type { Browser, BrowserContext, Page } from "playwright";
import { evidenceFolder, settle, withBrowser } from "./browser.ts";
import { get, healthyInstance } from "./instance.ts";

interface Visitor {
  width?: number;
  height?: number;
  /** The browser language, sent as Accept-Language. */
  language?: string;
}

interface Session {
  base: string;
  browser: Browser;
  evidence: string;
  /** Every context the script opened, to close them and screenshot their pages on failure. */
  contexts: BrowserContext[];
  transcript: string[];
}

/** What a script sees as its globals; SKILL.md documents each one. */
function scriptHelpers({ base, browser, evidence, contexts, transcript }: Session) {
  return {
    base,
    browser,
    evidence,
    /** A fresh visitor with no cookies. */
    async newPage({ width = 1280, height = 800, language = "en" }: Visitor = {}) {
      const context = await browser.newContext({
        viewport: { width, height },
        locale: language,
        reducedMotion: "reduce",
        permissions: ["clipboard-read", "clipboard-write"]
      });
      contexts.push(context);
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

/** Where in the script it failed: the function wrapper puts two lines before the script's first. */
function scriptLine(stack: string): string {
  const where = /<anonymous>:(\d+):\d+/.exec(stack)?.[1];
  return where ? ` (line ${Number(where) - 2} of the script)` : "";
}

/** Keeps a screenshot of every open page and the stack, and says which script line failed. */
async function recordFailure(error: unknown, { contexts, evidence, transcript }: Session) {
  const pages = contexts.flatMap((context) => context.pages());
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

export async function run(label: string) {
  const { base } = healthyInstance();
  const evidence = evidenceFolder(label);
  const code = await text(process.stdin);
  writeFileSync(join(evidence, "drive.js"), code);

  await withBrowser(async (browser) => {
    const session: Session = { base, browser, evidence, contexts: [], transcript: [] };
    const helpers = scriptHelpers(session);
    const drive = new AsyncFunction(`{ ${Object.keys(helpers).join(", ")} }`, code);
    try {
      await drive(helpers);
    } catch (error) {
      await recordFailure(error, session);
      process.exitCode = 1;
    } finally {
      writeFileSync(join(evidence, "output.txt"), `${session.transcript.join("\n")}\n`);
      await Promise.all(session.contexts.map((context) => context.close()));
      console.log(`evidence: ${evidence}`);
    }
  });
}
