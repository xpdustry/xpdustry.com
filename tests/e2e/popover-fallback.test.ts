import { expect, test, type Page } from "#tests/support/test.ts";

/**
 * What a browser without CSS anchor positioning keeps of a stylesheet: it drops each declaration
 * it cannot parse, and so every one that uses `anchor()` or the anchor properties. Chromium 158
 * and Firefox 159 both have anchor positioning, and Chromium's switch to turn it off is gone.
 */
const ANCHOR_DECLARATION =
  /(?:[\w-]+\s*:[^;{}]*\banchor\([^;{}]*|(?:anchor-name|position-anchor|position-try[\w-]*)\s*:[^;{}]*)(?:;|(?=\}))/g;

const withoutAnchorPositioning = (page: Page) =>
  page.route(/\.css(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    const css = (await response.text()).replaceAll(ANCHOR_DECLARATION, "");
    await route.fulfill({ response, body: css });
  });

/** `GAP_UNDER_BUTTON` in `src/shell/popover.ts`, what the anchored list keeps under its button. */
const GAP_UNDER_BUTTON = 10;
const HEIGHT = 900;

test("hangs the language list just under its button, flush with the header's end, at both ends of the desktop widths", async ({
  page
}) => {
  await withoutAnchorPositioning(page);
  await page.setViewportSize({ width: 1200, height: HEIGHT });
  await page.goto("/");
  const button = page.getByRole("banner").getByRole("button", { name: /^Language/ });
  await button.click();
  const list = page.getByRole("list", { name: "Language" });
  await expect(list).toBeVisible();
  // Nothing is left to anchor to: no element from the button up names an anchor.
  const anchors = await button.evaluate((element) => {
    const named: string[] = [];
    for (let at: Element | null = element; at; at = at.parentElement) {
      const name = getComputedStyle(at).getPropertyValue("anchor-name").trim();
      if (name && name !== "none") named.push(name);
    }
    return named;
  });
  expect(anchors).toEqual([]);
  for (const width of [1200, 1920]) {
    await page.setViewportSize({ width, height: HEIGHT });
    const [under, over] = [(await button.boundingBox())!, (await list.boundingBox())!];
    // Without an anchor the list hangs at the header's end, its last control's right edge.
    const headerEnd = await page
      .getByRole("banner")
      .evaluate((banner) =>
        Math.max(
          ...[...banner.querySelectorAll("a, button")]
            .filter((control) => control.checkVisibility() && !control.closest("[popover]"))
            .map((control) => control.getBoundingClientRect().right)
        )
      );
    expect({
      width,
      gap: Math.round(over.y - (under.y + under.height)),
      rightOfHeaderEnd: Math.round(over.x + over.width - headerEnd),
      inside: over.x >= 0 && over.x + over.width <= width && over.y + over.height <= HEIGHT
    }).toEqual({ width, gap: GAP_UNDER_BUTTON, rightOfHeaderEnd: 0, inside: true });
  }
});
