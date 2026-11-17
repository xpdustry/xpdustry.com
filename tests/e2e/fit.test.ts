import { withLocale } from "#app/i18n/localePath.ts";
import { LOCALES } from "#app/i18n/locales.ts";
import {
  fontGrowthFindings,
  layoutFindings,
  overflowFindings,
  rememberFontSizesOn
} from "#tests/support/fit.ts";
import { expect, test, type CDPSession, type Page } from "#tests/support/test.ts";

const HEIGHT = 900;
const MAIN_WIDTHS = [1280, 1000, 600, 320];
const HEADER_AT_ITS_TIGHTEST = [841, 681, 471];
/**
 * Each page with the widths and languages it is measured at: 56 layouts under the four text
 * settings make 224 states. The home page adds the header's fold at 1160/1161 and a phone; the
 * blog, whose header carries the play pill, adds the width just above each of its other folds.
 */
const MATRIX = [
  { path: "/", widths: [1280, 1161, 1160, 1000, 600, 390, 320], locales: LOCALES },
  { path: "/blog", widths: [...MAIN_WIDTHS, ...HEADER_AT_ITS_TIGHTEST], locales: LOCALES },
  { path: "/blog/nohorny-4-beta-8", widths: MAIN_WIDTHS, locales: LOCALES },
  { path: "/no-such-page", widths: [1280, 320], locales: ["en"] }
];

const WCAG_TEXT_SPACING =
  "* { line-height: 1.5 !important; letter-spacing: 0.12em !important; " +
  "word-spacing: 0.16em !important } p { margin-bottom: 2em !important }";
const TEXT_ONLY_ZOOM = ":root { font-size: 200% }";
const DEFAULT_FONT_SIZES = { standard: 16, fixed: 13 };
const DOUBLED_FONT_SIZES = { standard: 32, fixed: 26 };

const nextFrame = (page: Page) =>
  page.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
  );

async function findingsUnderEachSetting(page: Page, session: CDPSession) {
  const findings: Record<string, string[]> = { default: await layoutFindings(page) };
  await rememberFontSizesOn(page);
  await session.send("Page.setFontSizes", { fontSizes: DOUBLED_FONT_SIZES });
  await nextFrame(page);
  findings["browser font size 200%"] = await fontGrowthFindings(page);
  await session.send("Page.setFontSizes", { fontSizes: DEFAULT_FONT_SIZES });
  for (const [setting, css] of [
    ["text-only zoom 200%", TEXT_ONLY_ZOOM],
    ["WCAG text spacing", WCAG_TEXT_SPACING]
  ]) {
    const sheet = await page.addStyleTag({ content: css });
    await nextFrame(page);
    findings[setting!] = await overflowFindings(page);
    await sheet.evaluate((element: Element) => element.remove());
  }
  return Object.fromEntries(Object.entries(findings).filter(([, found]) => found.length > 0));
}

// One load per page: every width after the first is a resize, which the footer, the scrollbar
// and the popovers follow, and the server renders the same page at every width.
for (const { path, widths, locales } of MATRIX) {
  for (const locale of locales) {
    const url = withLocale(path, locale);
    test(`${url} fits at every width, under every text setting`, async ({ page }) => {
      // Each width was a test of its own with Playwright's 30 s.
      test.setTimeout(widths.length * 30_000);
      await page.setViewportSize({ width: widths[0]!, height: HEIGHT });
      await page.goto(url);
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      const session = await page.context().newCDPSession(page);
      const found: Record<string, Record<string, string[]>> = {};
      for (const width of widths) {
        await page.setViewportSize({ width, height: HEIGHT });
        await nextFrame(page);
        const issues = await findingsUnderEachSetting(page, session);
        if (Object.keys(issues).length > 0) found[`${width}px`] = issues;
      }
      expect(found).toEqual({});
    });
  }
}
