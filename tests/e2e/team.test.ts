import { ringStrength } from "#tests/support/focus.ts";
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

const PROFILES = [
  { path: "/", opener: /^ZetaMap/, name: "ZetaMap", links: ["GitHub", "zetamap.fr"] },
  {
    path: "/blog/nohorny-4-beta-8",
    opener: "phinner, open profile",
    name: "phinner",
    links: ["GitHub", "phinner.dev"]
  }
];

for (const { path, opener, name, links } of PROFILES) {
  for (const width of [1280, 390]) {
    test(`on ${path} at ${width}px the keyboard walks ${name}'s profile and leaves it shut behind`, async ({
      page
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      const button = page.getByRole("button", { name: opener });
      const profile = page.getByRole("dialog", { name });
      await page.keyboard.press("Tab");
      await button.focus();
      await page.keyboard.press("Tab");
      await page.evaluate(() => document.activeElement!.setAttribute("data-after-opener", ""));
      const afterOpener = page.locator("[data-after-opener]");
      await page.keyboard.press("Shift+Tab");
      await expect(button).toBeFocused();

      await page.keyboard.press("Enter");
      await expect(profile).toBeVisible();
      await expect(profile.getByRole("button", { name: "Close" })).toBeFocused();
      const rings = [await ringStrength(page)];
      for (const link of links) {
        await page.keyboard.press("Tab");
        await expect(profile.getByRole("link", { name: link })).toBeFocused();
        rings.push(await ringStrength(page));
      }
      for (const { changed, needed } of rings) expect(changed).toBeGreaterThanOrEqual(needed);
      await page.keyboard.press("Tab");
      await expect(profile).toBeHidden();
      await expect(afterOpener).toBeFocused();
      const box = (await afterOpener.boundingBox())!;
      const onTop = await afterOpener.evaluate(
        (control, [x, y]) => control.contains(document.elementFromPoint(x!, y!)),
        [box.x + box.width / 2, box.y + box.height / 2]
      );
      expect(onTop).toBe(true);

      await page.keyboard.press("Shift+Tab");
      await expect(button).toBeFocused();
      await page.keyboard.press("Enter");
      await page.keyboard.press("Escape");
      await expect(profile).toBeHidden();
      await expect(button).toBeFocused();

      await page.keyboard.press("Enter");
      await expect(profile.getByRole("button", { name: "Close" })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(profile).toBeHidden();
      await expect(button).toBeFocused();
    });
  }
}

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
