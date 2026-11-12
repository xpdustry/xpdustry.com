import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Browser, Page } from "playwright";
import { HOME, fail } from "./instance.ts";

export async function withBrowser<T>(use: (browser: Browser) => Promise<T>): Promise<T> {
  const { chromium } = await import("playwright").catch(() =>
    fail("Playwright is not installed; run `pnpm install`")
  );
  const browser = await chromium
    .launch()
    .catch((error: Error) =>
      fail(`${error.message.split("\n")[0]}\nrun \`pnpm exec playwright install chromium\``)
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
