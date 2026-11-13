import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Browser, LaunchOptions, Page } from "playwright";
import { HOME, fail } from "./instance.ts";

/**
 * The browsers a run can drive. Firefox has no clipboard permission to grant, so it gets the
 * preference that lets a page read and write the clipboard without a prompt.
 */
const ENGINES = {
  chromium: {},
  firefox: { firefoxUserPrefs: { "dom.events.testing.asyncClipboard": true } }
} satisfies Record<string, LaunchOptions>;

export type Engine = keyof typeof ENGINES;

export function engine(name: string): Engine {
  if (name in ENGINES) return name as Engine;
  return fail(`unknown browser "${name}"; use ${Object.keys(ENGINES).join(" or ")}`);
}

/** Playwright never downloads a browser on its own: a missing one fails with how to install it. */
export async function withBrowser<T>(
  use: (browser: Browser) => Promise<T>,
  name: Engine = "chromium"
): Promise<T> {
  const playwright = await import("playwright").catch(() =>
    fail("Playwright is not installed; run `pnpm install`")
  );
  const browser = await playwright[name]
    .launch(ENGINES[name])
    .catch((error: Error) =>
      fail(`${error.message.split("\n")[0]}\nrun \`pnpm exec playwright install ${name}\``)
    );
  try {
    return await use(browser);
  } finally {
    await browser.close();
  }
}

/** Navigates and waits for the network and the fonts to settle. */
export async function settle(page: Page, url: string) {
  const response = await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  return response;
}

/** A new folder for one run's proof, named by local time. */
export function evidenceFolder(label: string): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  const stamp = local.toISOString().slice(0, 19).replaceAll(/[-:]/g, "").replace("T", "-");
  const folder = join(HOME, "evidence", `${stamp}-${label}`);
  mkdirSync(folder, { recursive: true });
  return folder;
}

/** Prints a check's findings and keeps them as evidence. */
export function report(label: string, lines: string[]) {
  for (const line of lines) console.log(line);
  const folder = evidenceFolder(label);
  writeFileSync(join(folder, "output.txt"), `${lines.join("\n")}\n`);
  console.log(`evidence: ${folder}`);
}
