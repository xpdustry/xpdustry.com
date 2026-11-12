import type { Browser, Page } from "playwright";
import { report, settle, withBrowser } from "./browser.ts";
import { healthyInstance } from "./instance.ts";
import {
  LAYOUT_CHECKS,
  OVERFLOW_CHECKS,
  fixedText,
  installHelpers,
  rememberFontSizes
} from "./page-checks.ts";
import { localised } from "./site.ts";

const WIDTHS = [1440, 1280, 1160, 1000, 760, 600, 390, 320];
const PAGES = ["/", "/blog", "/blog/nohorny-4-beta-11", "/blog/nohorny-4-beta-8", "/no-such-page"];

/** WCAG 1.4.12: the spacing a reader may impose without losing content. */
const TEXT_SPACING =
  "* { line-height: 1.5 !important; letter-spacing: 0.12em !important; " +
  "word-spacing: 0.16em !important } p { margin-bottom: 2em !important }";

/** Settings applied through a style sheet, after the browser's own font size. */
const STYLE_SETTINGS = [
  // Text doubled while every breakpoint stays put: the worst case of a text-only zoom.
  ["text zoom 200%", ":root { font-size: 200% }"],
  ["text spacing", TEXT_SPACING]
] as const;

const nextFrame = (page: Page) =>
  page.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
  );

async function findings(page: Page, checks: readonly (() => string[])[]): Promise<string[]> {
  const found: string[] = [];
  for (const check of checks) found.push(...(await page.evaluate(check)));
  return found;
}

/** The browser's own font size setting, doubled. Breakpoints in rem follow it. */
async function doubledFontSizeIssues(page: Page): Promise<string[]> {
  const browser = await page.context().newCDPSession(page);
  await page.evaluate(rememberFontSizes);
  await browser.send("Page.setFontSizes", { fontSizes: { standard: 32, fixed: 26 } });
  await nextFrame(page);
  const found = await findings(page, [...OVERFLOW_CHECKS, fixedText]);
  await browser.send("Page.setFontSizes", { fontSizes: { standard: 16, fixed: 13 } });
  await browser.detach();
  return found;
}

async function styleSettingIssues(page: Page, css: string): Promise<string[]> {
  const sheet = await page.addStyleTag({ content: css });
  await nextFrame(page);
  const found = await findings(page, OVERFLOW_CHECKS);
  await sheet.evaluate((element) => element.remove());
  return found;
}

/**
 * The page under each text setting a reader may choose, with what it got wrong. The page is
 * loaded once; every setting is applied and undone in place.
 */
async function textSettingIssues(page: Page): Promise<[string, string[]][]> {
  await page.evaluate(installHelpers);
  const results: [string, string[]][] = [
    ["", await findings(page, [...LAYOUT_CHECKS, ...OVERFLOW_CHECKS])],
    ["text 200%", await doubledFontSizeIssues(page)]
  ];
  for (const [name, css] of STYLE_SETTINGS)
    results.push([name, await styleSettingIssues(page, css)]);
  await nextFrame(page);
  return results;
}

/** A loaded page's findings, as `<width> <url>[, <setting>]: <what>` lines. */
async function pageIssues(page: Page, width: number, url: string): Promise<string[]> {
  return (await textSettingIssues(page)).flatMap(([setting, found]) => {
    const where = setting ? `${width}px ${url}, ${setting}` : `${width}px ${url}`;
    return found.map((issue) => `${where}: ${issue}`);
  });
}

/** Every page at one width in one language. */
async function widthIssues(browser: Browser, base: string, locale: string, width: number) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion: "reduce"
  });
  const page = await context.newPage();
  const issues: string[] = [];
  for (const path of PAGES) {
    const url = localised(locale, path);
    await settle(page, base + url);
    issues.push(...(await pageIssues(page, width, url)));
  }
  await context.close();
  return issues;
}

export async function audit(locales: string[]) {
  const { base } = healthyInstance();
  const issues: string[] = [];
  await withBrowser(async (browser) => {
    for (const locale of locales) {
      for (const width of WIDTHS) issues.push(...(await widthIssues(browser, base, locale, width)));
      console.error(`audit: ${locale} done`);
    }
  });
  const renders = locales.length * WIDTHS.length * PAGES.length;
  report("audit", [
    ...issues,
    `audit: ${issues.length} issue(s) across ${renders} page renders, ` +
      `each under 4 text settings (${locales.join(", ")})`
  ]);
  if (issues.length > 0) process.exitCode = 1;
}
