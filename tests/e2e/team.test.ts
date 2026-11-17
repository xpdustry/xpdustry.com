import { expect, test } from "#tests/support/test.ts";

test("a teammate's tile opens their profile, which closes every way a popover does", async ({
  page
}) => {
  await page.goto("/");
  const team = page.locator("#team");
  await team.getByRole("button", { name: /^ZetaMap/ }).click();
  const profile = page.getByRole("dialog", { name: "ZetaMap" });
  await expect(profile).toContainText(/Owner.*Developer.*Co-owns Chaotic Neutral/s);

  await page.keyboard.press("Escape");
  await expect(profile).toBeHidden();

  await team.getByRole("button", { name: /^ZetaMap/ }).click();
  await team.getByRole("button", { name: /^phinner/ }).click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName("phinner");

  await page
    .getByRole("dialog", { name: "phinner" })
    .getByRole("button", { name: "Close" })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await team.getByRole("button", { name: /^ZetaMap/ }).click();
  await page.mouse.click(5, 5);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

const DOUBLED_TEXT = ":root { font-size: 200% }";

test.describe("on a phone held sideways, under doubled text", () => {
  test.use({ viewport: { width: 667, height: 375 } });

  test("a French profile reads in French, stays within the screen and scrolls to its links", async ({
    page
  }) => {
    await page.goto("/fr");
    await page.addStyleTag({ content: DOUBLED_TEXT });
    await page
      .locator("#team")
      .getByRole("button", { name: /^ZetaMap/ })
      .click();
    const profile = page.getByRole("dialog", { name: "ZetaMap" });
    await expect(profile).toContainText(/Propriétaire.*Copropriétaire de Chaotic Neutral/s);
    const box = (await profile.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(667);
    expect(box.y + box.height).toBeLessThanOrEqual(375);

    const site = profile.getByRole("link", { name: "zetamap.fr" });
    await site.scrollIntoViewIfNeeded();
    await expect(site).toBeInViewport();
  });
});
