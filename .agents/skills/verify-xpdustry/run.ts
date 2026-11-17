import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { text } from "node:stream/consumers";
import type { Browser, BrowserContextOptions, Page } from "playwright";
import { BROWSERS_WITH_OPEN_CLIPBOARD } from "#tests/support/browsers.ts";
import { httpGet } from "#tests/support/http.ts";
import { HOME, fail, healthyInstance } from "./instance.ts";

export type Engine = keyof typeof BROWSERS_WITH_OPEN_CLIPBOARD;

export function engine(name: string): Engine {
  if (name in BROWSERS_WITH_OPEN_CLIPBOARD) return name as Engine;
  return fail(
    `unknown browser "${name}"; use ${Object.keys(BROWSERS_WITH_OPEN_CLIPBOARD).join(" or ")}`
  );
}

interface Visitor {
  width?: number;
  height?: number;
  language?: string;
  motion?: boolean;
  scripts?: boolean;
  record?: boolean;
}

const SETTLED_VISITOR: Required<Visitor> = {
  width: 1280,
  height: 800,
  language: "en",
  motion: false,
  scripts: true,
  record: false
};

function evidenceFolder(label: string): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  const stamp = local.toISOString().slice(0, 19).replaceAll(/[-:]/g, "").replace("T", "-");
  const folder = join(HOME, "evidence", `${stamp}-${label}`);
  mkdirSync(folder, { recursive: true });
  return folder;
}

async function launchBrowser(name: Engine): Promise<Browser> {
  const playwright = await import("playwright");
  return playwright[name]
    .launch(BROWSERS_WITH_OPEN_CLIPBOARD[name].launch)
    .catch((error: Error) =>
      fail(`${error.message.split("\n")[0]}\nrun \`pnpm exec playwright install ${name}\``)
    );
}

function contextOptions(name: Engine, evidence: string, visitor: Visitor): BrowserContextOptions {
  const { width, height, language, motion, scripts, record } = { ...SETTLED_VISITOR, ...visitor };
  return {
    ...BROWSERS_WITH_OPEN_CLIPBOARD[name].context,
    viewport: { width, height },
    locale: language,
    reducedMotion: motion ? "no-preference" : "reduce",
    javaScriptEnabled: scripts,
    recordVideo: record ? { dir: evidence, size: { width, height } } : undefined
  };
}

interface Session {
  base: string;
  browser: Browser;
  name: Engine;
  evidence: string;
  transcript: string[];
}

function scriptGlobals({ base, browser, name, evidence, transcript }: Session) {
  const print = (...values: unknown[]) => {
    const line = values
      .map((value) => (typeof value === "string" ? value : JSON.stringify(value)))
      .join(" ");
    console.log(line);
    transcript.push(line);
  };
  return {
    base,
    browser,
    evidence,
    print,
    async newPage(visitor: Visitor = {}) {
      if (visitor.scripts === false && name !== "chromium") {
        fail(
          "newPage({ scripts: false }) needs Chromium: Playwright cannot evaluate in a Firefox page whose scripts are off"
        );
      }
      const context = await browser.newContext(contextOptions(name, evidence, visitor));
      return context.newPage();
    },
    async go(page: Page, path: string) {
      const response = await page.goto(base + path, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      return response;
    },
    get: (path: string, headers?: Record<string, string>) => httpGet(base + path, headers),
    async snap(page: Page, label: string) {
      await page.screenshot({ path: join(evidence, `${label}.png`) });
      const tree = await page.locator("body").ariaSnapshot();
      writeFileSync(
        join(evidence, `${label}.aria.txt`),
        `${page.url()}\n${await page.title()}\n\n${tree}\n`
      );
    },
    save(file: string, content: string | Uint8Array) {
      writeFileSync(join(evidence, file), content);
    }
  };
}

const LINES_BEFORE_THE_SCRIPT = 2;

function scriptLine(stack: string): string {
  const where = [...stack.matchAll(/<anonymous>:(\d+):\d+/g)].at(-1)?.[1];
  return where ? ` (line ${Number(where) - LINES_BEFORE_THE_SCRIPT} of the script)` : "";
}

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

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (
  ...parameters: string[]
) => (globals: object) => Promise<void>;

export async function run(label: string, name: Engine) {
  const { base } = healthyInstance();
  const evidence = evidenceFolder(label);
  const code = await text(process.stdin);
  writeFileSync(join(evidence, "drive.js"), code);

  const browser = await launchBrowser(name);
  const session: Session = { base, browser, name, evidence, transcript: [] };
  const globals = scriptGlobals(session);
  try {
    const drive = new AsyncFunction(`{ ${Object.keys(globals).join(", ")} }`, code);
    await drive(globals);
  } catch (error) {
    await recordFailure(error, session);
    process.exitCode = 1;
  } finally {
    writeFileSync(join(evidence, "output.txt"), `${session.transcript.join("\n")}\n`);
    await Promise.all(browser.contexts().map((context) => context.close()));
    await browser.close();
    console.log(`evidence: ${evidence}`);
  }
}
