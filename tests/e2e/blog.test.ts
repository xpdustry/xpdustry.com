import { expect, test } from "#tests/support/test.ts";

test("a post opened from the blog loads its body in place", async ({ page }) => {
  await page.goto("/blog");
  await page.waitForFunction(() => "hydrated" in document.documentElement.dataset);
  const current = page.locator('a[aria-current="page"]');
  await expect(current.first()).toBeAttached();
  expect(
    new Set(await current.evaluateAll((links) => links.map((link) => link.getAttribute("href"))))
  ).toEqual(new Set(["/blog"]));
  await page
    .getByRole("main")
    .getByRole("link", { name: /Beta 8/ })
    .first()
    .click();

  await expect(page).toHaveURL(/\/blog\/nohorny-4-beta-8$/);
  await expect(current).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /NoHorny 4 Beta 8:\s*Breaking changes and blurred alerts/
  );
  await expect(page.getByRole("note").filter({ hasText: "Breaking change" })).toBeVisible();
  const image = page.getByRole("main").getByRole("figure").getByRole("img");
  await image.scrollIntoViewIfNeeded();
  await expect
    .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true);
});
