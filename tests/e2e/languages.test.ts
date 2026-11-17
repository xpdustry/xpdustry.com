import { expect, test } from "#tests/support/test.ts";

test("a visitor switches language from the header and keeps it", async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Language: English" }).click();
  await page
    .getByRole("list", { name: "Language" })
    .getByRole("link", { name: "Français" })
    .click();

  await expect(page).toHaveURL(/\/fr$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.getByRole("button", { name: "Langue : Français" })).toBeVisible();

  await page.getByRole("navigation").first().getByRole("link", { name: "Blog" }).click();
  await expect(page).toHaveURL(/\/fr\/blog$/);

  await page.goto("/");
  await expect(page).toHaveURL(/\/fr$/);
  const cookies = await context.cookies();
  expect(cookies.find((cookie) => cookie.name === "generaltranslation.locale")?.value).toBe("fr");
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, locale: "ru-RU" });

  test("a Russian browser lands in Russian and switches from the menu", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/ru$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ru");

    await page.getByRole("button", { name: "Меню" }).click();
    await page.getByRole("list", { name: "Язык" }).getByRole("link", { name: "Français" }).click();
    await expect(page).toHaveURL(/\/fr$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");

    await page.getByRole("button", { name: "Menu" }).click();
    await expect(
      page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link")
    ).toHaveText(["Accueil", "Blog", "English", "Français", "Русский"]);
  });
});

test("the menu closes when the window grows wide enough for the navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1160, height: 800 });
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  const menu = page.getByRole("navigation", { name: "Main" });
  await expect(menu.getByRole("link", { name: "Blog" })).toBeVisible();

  await page.setViewportSize({ width: 1161, height: 800 });
  await expect(page.getByRole("button", { name: "Menu" })).toBeHidden();
  await expect.poll(() => menu.evaluate((nav) => nav.matches(":popover-open"))).toBe(false);
});

test.describe("a browser that keeps no cookies or storage", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(Document.prototype, "cookie", { get: () => "", set: () => {} });
      Object.defineProperty(window, "localStorage", {
        get: () => {
          throw new DOMException("Blocked", "SecurityError");
        }
      });
    });
  });

  test("still reads a French post in French, and follows its links in French", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/fr/blog/nohorny-4-beta-11");
    const served = await page.title();
    await page.waitForFunction(() => "hydrated" in document.documentElement.dataset);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    expect(await page.title()).toBe(served);
    expect(errors).toEqual([]);

    await page.getByRole("navigation").first().getByRole("link", { name: "Blog" }).click();
    await expect(page).toHaveURL(/\/fr\/blog$/);
    await page
      .getByRole("main")
      .getByRole("link", { name: /Bêta 8/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/fr\/blog\/nohorny-4-beta-8$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  });
});

test("a Ctrl-click on a language opens it in a new tab and leaves the page as it is", async ({
  page,
  context
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.waitForFunction(() => "hydrated" in document.documentElement.dataset);
  await page.getByRole("button", { name: "Language: English" }).click();
  const opened = context.waitForEvent("page");
  await page
    .getByRole("list", { name: "Language" })
    .getByRole("link", { name: "Français" })
    .click({ modifiers: ["ControlOrMeta"] });

  const tab = await opened;
  await tab.waitForLoadState();
  expect(new URL(tab.url()).pathname).toBe("/fr");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test.describe("a browser that runs no scripts", () => {
  test.use({ javaScriptEnabled: false });

  test("still switches language from the header, there and back", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Language: English" }).click();
    await page
      .getByRole("list", { name: "Language" })
      .getByRole("link", { name: "Français" })
      .click();
    await expect(page).toHaveURL(/\/fr$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");

    await page.getByRole("button", { name: "Langue : Français" }).click();
    await page.getByRole("list", { name: "Langue" }).getByRole("link", { name: "English" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});
