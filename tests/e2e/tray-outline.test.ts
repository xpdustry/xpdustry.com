import { decode } from "fast-png";
import { expect, test, type Locator, type Page } from "#tests/support/test.ts";

/**
 * What a browser without `shape()` keeps of a stylesheet: it drops each declaration that uses an
 * unknown function, and its `@supports` test for one fails. Renaming the function does both.
 */
const SHAPE_FUNCTION = /(?<![\w-])shape\(/g;

const withoutShapes = (page: Page) =>
  page.route(/\.css(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    const css = (await response.text()).replaceAll(SHAPE_FUNCTION, "unknown-shape(");
    await route.fulfill({ response, body: css });
  });

type Rgb = [number, number, number];

const INSIDE_THE_OUTLINE = 1;
const INSIDE_THE_FACE = 8;
const SAME_COLOUR = 40;

async function pixel(page: Page, x: number, y: number): Promise<Rgb> {
  const shot = decode(await page.screenshot({ clip: { x, y, width: 1, height: 1 } }));
  const [r, g, b] = shot.data;
  return [r!, g!, b!];
}

const rgb = (css: string): Rgb => css.match(/\d+/g)!.slice(0, 3).map(Number) as Rgb;

const near = (a: Rgb, b: Rgb) =>
  a.every((channel, at) => Math.abs(channel - b[at]!) <= SAME_COLOUR);

async function outlineOf(page: Page, element: Locator, pseudo?: "::before" | "::after") {
  await element.scrollIntoViewIfNeeded();
  const { box, colour } = await element.evaluate((node, pseudo) => {
    const { x, y, width, height } = node.getBoundingClientRect();
    return {
      box: { x, y, width, height },
      colour: getComputedStyle(node, pseudo).borderTopColor
    };
  }, pseudo);
  const middle = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  return {
    colour: rgb(colour),
    top: await pixel(page, middle.x, box.y + INSIDE_THE_OUTLINE),
    left: await pixel(page, box.x + INSIDE_THE_OUTLINE, middle.y),
    inside: await pixel(page, box.x + INSIDE_THE_FACE, middle.y)
  };
}

async function expectTraysOutlined(page: Page) {
  await page.goto("/");
  const news = page.locator("#news");
  const tab = news.locator(":scope > header");
  const body = news.locator(":scope > span");
  for (const [part, outline] of [
    ["tab", await outlineOf(page, tab, "::before")],
    ["body", await outlineOf(page, body)]
  ] as const) {
    expect({
      part,
      top: near(outline.top, outline.colour),
      left: near(outline.left, outline.colour)
    }).toEqual({
      part,
      top: true,
      left: true
    });
    expect({ part, insideIsOutline: near(outline.inside, outline.colour) }).toEqual({
      part,
      insideIsOutline: false
    });
  }
  await expect(tab.getByRole("heading", { name: "Latest news" })).toBeVisible();
  const card = news.getByRole("link").filter({ hasText: /Beta/ }).first();
  const hit = await card.evaluate((link) => {
    const { x, y, width, height } = link.getBoundingClientRect();
    return link.contains(document.elementFromPoint(x + width / 2, y + height / 2));
  });
  expect(hit).toBe(true);
  return card;
}

test("a browser without shape() still outlines the trays and their tabs with borders", async ({
  page
}) => {
  await withoutShapes(page);
  await expectTraysOutlined(page);
});

test("forced colours keep the outline of the trays, their tabs and the cards", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  const card = await expectTraysOutlined(page);
  const ring = await outlineOf(page, card, "::after");
  expect({ top: near(ring.top, ring.colour), left: near(ring.left, ring.colour) }).toEqual({
    top: true,
    left: true
  });
  expect(near(ring.inside, ring.colour)).toBe(false);
});
