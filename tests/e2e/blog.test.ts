import { expect, test } from "#tests/support/test.ts";

test("a post opened from the blog loads its body in place", async ({ page }) => {
  await page.goto("/blog");
  await page.waitForFunction(() => "hydrated" in document.documentElement.dataset);
  await page
    .getByRole("main")
    .getByRole("link", { name: /Beta 8/ })
    .first()
    .click();

  await expect(page).toHaveURL(/\/blog\/nohorny-4-beta-8$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /NoHorny 4 Beta 8:\s*Breaking changes and blurred alerts/
  );
  await expect(
    page.getByRole("complementary").filter({ hasText: "Breaking change" })
  ).toBeVisible();
  const image = page.getByRole("main").getByRole("figure").getByRole("img");
  await image.scrollIntoViewIfNeeded();
  await expect
    .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true);
});
