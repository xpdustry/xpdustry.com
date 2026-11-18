import { withLocale } from "#app/i18n/localePath.ts";
import { LOCALES } from "#app/i18n/locales.ts";
import { BROWSERS_WITH_OPEN_CLIPBOARD } from "#tests/support/browsers.ts";
import {
  fontGrowthFindings,
  headerFindings,
  layoutFindings,
  overflowFindings,
  rememberFontSizesOn
} from "#tests/support/fit.ts";
import { refuseCopy, showPlayers } from "#tests/support/playPill.ts";
import { expect, test, type CDPSession, type Page } from "#tests/support/test.ts";

const HEIGHT = 900;
const MAIN_WIDTHS = [1280, 1000, 600, 320];
const JUST_ABOVE_THE_HEADER_FOLDS = [1161, 681, 471];
/**
 * Each page with the widths and languages it is measured at: 56 layouts. The home page adds the
 * header's fold at 1160/1161 and a phone; the blog, whose header carries the play pill, adds the
 * width just above each of its other folds, and measures its header again with the pill showing
 * each of `PILL_STATES`: 42 header layouts. Chromium measures them under the four text settings,
 * 392 states. Firefox measures the blog's header in its 63 layouts, under the three settings it
 * can set from the page and with its font size doubled from its settings: 252 states.
 */
const MATRIX = [
  { path: "/", widths: [1280, 1161, 1160, 1000, 600, 390, 320], locales: LOCALES },
  { path: "/blog", widths: [...MAIN_WIDTHS, ...JUST_ABOVE_THE_HEADER_FOLDS], locales: LOCALES },
  { path: "/blog/nohorny-4-beta-8", widths: MAIN_WIDTHS, locales: LOCALES },
  { path: "/no-such-page", widths: [1280, 320], locales: ["en"] }
];
const PILL_STATES = {
  "888,888 online": (page: Page) => showPlayers(page, 888_888),
  "a refused copy": refuseCopy
};

const WCAG_TEXT_SPACING =
  "* { line-height: 1.5 !important; letter-spacing: 0.12em !important; " +
  "word-spacing: 0.16em !important } p { margin-bottom: 2em !important }";
const TEXT_ONLY_ZOOM = ":root { font-size: 200% }";
const DEFAULT_FONT_SIZES = { standard: 16, fixed: 13 };
const DOUBLED_FONT_SIZES = { standard: 32, fixed: 26 };
const FIREFOX_DOUBLED_FONT_SIZES = Object.fromEntries(
  ["x-western", "x-cyrillic", "x-unicode"].flatMap((group) => [
    [`font.size.variable.${group}`, DOUBLED_FONT_SIZES.standard],
    [`font.size.monospace.${group}`, DOUBLED_FONT_SIZES.fixed]
  ])
);

type Measure = (page: Page) => Promise<string[]>;
interface Measures {
  atDefault: Measure;
  afterFontGrew: Measure;
  underTextSetting: Measure;
}
const WHOLE_PAGE: Measures = {
  atDefault: layoutFindings,
  afterFontGrew: fontGrowthFindings,
  underTextSetting: overflowFindings
};
const HEADER: Measures = {
  atDefault: headerFindings,
  afterFontGrew: headerFindings,
  underTextSetting: headerFindings
};

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index);

const nextFrame = (page: Page) =>
  page.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
  );

/** Chromium sets the browser's font size through CDP; Firefox only from its settings, at launch. */
async function findingsUnderEachSetting(
  page: Page,
  fontSizes: CDPSession | undefined,
  measures: Measures
) {
  const findings: Record<string, string[]> = { default: await measures.atDefault(page) };
  if (fontSizes) {
    await rememberFontSizesOn(page);
    await fontSizes.send("Page.setFontSizes", { fontSizes: DOUBLED_FONT_SIZES });
    await nextFrame(page);
    findings["browser font size 200%"] = await measures.afterFontGrew(page);
    await fontSizes.send("Page.setFontSizes", { fontSizes: DEFAULT_FONT_SIZES });
  }
  for (const [setting, css] of [
    ["text-only zoom 200%", TEXT_ONLY_ZOOM],
    ["WCAG text spacing", WCAG_TEXT_SPACING]
  ]) {
    const sheet = await page.addStyleTag({ content: css });
    await nextFrame(page);
    findings[setting!] = await measures.underTextSetting(page);
    await sheet.evaluate((element: Element) => element.remove());
  }
  return Object.fromEntries(Object.entries(findings).filter(([, found]) => found.length > 0));
}

async function open(page: Page, url: string, width: number) {
  await page.setViewportSize({ width, height: HEIGHT });
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}

async function findingsAtEachWidth(
  page: Page,
  widths: readonly number[],
  findingsAt: (page: Page) => Promise<Record<string, string[]> | string[]>
) {
  const found: Record<string, unknown> = {};
  for (const width of widths) {
    await page.setViewportSize({ width, height: HEIGHT });
    await nextFrame(page);
    const issues = await findingsAt(page);
    if (Object.keys(issues).length > 0) found[`${width}px`] = issues;
  }
  return found;
}

// One load per page: every width after the first is a resize, which the footer, the scrollbar
// and the popovers follow, and the server renders the same page at every width.
for (const { path, widths, locales } of MATRIX) {
  for (const locale of locales) {
    const url = withLocale(path, locale);
    const statesOfThePill = path === "/blog" ? Object.entries(PILL_STATES) : [];
    test(`${url} fits at every width, under every text setting`, async ({ page, browserName }) => {
      const chromium = browserName === "chromium";
      test.skip(!chromium && path !== "/blog", "Firefox measures the header, on the blog");
      // Each width was a test of its own with Playwright's 30 s.
      test.setTimeout(widths.length * (1 + statesOfThePill.length) * 30_000);
      await open(page, url, widths[0]!);
      const fontSizes = chromium ? await page.context().newCDPSession(page) : undefined;
      const found: Record<string, unknown> = await findingsAtEachWidth(page, widths, (page) =>
        findingsUnderEachSetting(page, fontSizes, chromium ? WHOLE_PAGE : HEADER)
      );
      for (const [state, show] of statesOfThePill) {
        await show(page);
        const inState = await findingsAtEachWidth(page, widths, (page) =>
          findingsUnderEachSetting(page, fontSizes, HEADER)
        );
        if (Object.keys(inState).length > 0) found[`with ${state}`] = inState;
      }
      expect(found).toEqual({});
    });
  }
}

/** Where a pill that kept room for five characters covered the brand, in the second review. */
const LONG_COUNTS_OVER_THE_BRAND = [
  { players: 88_888, setting: WCAG_TEXT_SPACING, widths: range(337, 344) },
  { players: 888_888, setting: TEXT_ONLY_ZOOM, widths: [...range(345, 357), ...range(404, 410)] }
];

for (const locale of ["en", "ru"]) {
  const url = withLocale("/blog", locale);
  test(`${url} keeps a long count off the brand`, async ({ page }) => {
    await open(page, url, 1280);
    const found: Record<string, unknown> = {};
    for (const { players, setting, widths } of LONG_COUNTS_OVER_THE_BRAND) {
      await page.unrouteAll();
      await showPlayers(page, players);
      const sheet = await page.addStyleTag({ content: setting });
      const atWidths = await findingsAtEachWidth(page, widths, headerFindings);
      if (Object.keys(atWidths).length > 0) found[`${players} online`] = atWidths;
      await sheet.evaluate((element: Element) => element.remove());
    }
    expect(found).toEqual({});
  });
}

test.describe("with the browser's font size doubled from its settings", () => {
  const widths = MATRIX.find(({ path }) => path === "/blog")!.widths;

  for (const locale of LOCALES) {
    const url = withLocale("/blog", locale);
    test(`${url} keeps its header on one row`, async ({ playwright, browserName, baseURL }) => {
      test.skip(browserName !== "firefox", "Chromium doubles it from the page, above");
      test.setTimeout(widths.length * 3 * 30_000);
      const { launch, context: options } = BROWSERS_WITH_OPEN_CLIPBOARD.firefox;
      const browser = await playwright.firefox.launch({
        firefoxUserPrefs: { ...launch.firefoxUserPrefs, ...FIREFOX_DOUBLED_FONT_SIZES }
      });
      const context = await browser.newContext({ ...options, baseURL, reducedMotion: "reduce" });
      await context.route(/painter\.worker/, (painter) => painter.abort());
      const page = await context.newPage();
      await open(page, url, widths[0]!);
      const rootFontSize = page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
      expect(await rootFontSize).toBe(`${DOUBLED_FONT_SIZES.standard}px`);
      const found: Record<string, unknown> = {};
      for (const [state, show] of Object.entries({ Checking: async () => {}, ...PILL_STATES })) {
        await show(page);
        const inState = await findingsAtEachWidth(page, widths, headerFindings);
        if (Object.keys(inState).length > 0) found[`with ${state}`] = inState;
      }
      await browser.close();
      expect(found).toEqual({});
    });
  }
});
