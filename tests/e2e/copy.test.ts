import { holdTheClock } from "#tests/support/clock.ts";
import { overflowFindings } from "#tests/support/fit.ts";
import { expect, test, type Page } from "#tests/support/test.ts";

const HUB = "hub.md.xpdustry.com";
const COPIED_FOR_MS = 1400;
const SURVIVAL = "survival.md.xpdustry.com";

test.beforeEach(async ({ page }) => {
  await holdTheClock(page);
});

const clipboard = (page: Page) => page.evaluate(() => navigator.clipboard.readText());
const emptyClipboard = (page: Page) => page.evaluate(() => navigator.clipboard.writeText(""));

for (const { home, mode, announced } of [
  { home: "/fr", mode: "Survie", announced: /Jouer, Rejoindre une partie, Ajouter un serveur/ },
  { home: "/ru", mode: "Выживание", announced: /«Играть», «Сетевая игра», «Добавить сервер»/ }
]) {
  test(`${home} copies a gamemode's address and says where to paste it`, async ({ page }) => {
    await page.goto(home);
    await emptyClipboard(page);
    const modes = page.locator("#gamemodes");
    await modes.getByRole("button", { name: mode }).click();
    await expect.poll(() => clipboard(page)).toBe(SURVIVAL);
    await expect(modes.getByRole("status").filter({ hasText: SURVIVAL })).toHaveText(announced);
  });
}

test("the play card copies the hub's address from a press anywhere on it", async ({ page }) => {
  await page.goto("/");
  await emptyClipboard(page);
  await page
    .getByRole("button", { name: `Copy ${HUB}`, exact: true })
    .click({ position: { x: 24, y: 24 } });
  await expect.poll(() => clipboard(page)).toBe(HUB);
  await expect(page.getByRole("banner").getByRole("button", { name: /^Copy/ })).toHaveCount(0);
});

test("the header pill copies the hub's address on every other page", async ({ page }) => {
  await page.goto("/blog");
  await emptyClipboard(page);
  await page
    .getByRole("banner")
    .getByRole("button", { name: `Copy ${HUB}` })
    .click();
  await expect.poll(() => clipboard(page)).toBe(HUB);
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("/ copies a gamemode's address, confirms it for a moment, and fits", async ({ page }) => {
    await page.goto("/");
    await emptyClipboard(page);
    const card = page.locator("#gamemodes").getByRole("listitem").filter({ hasText: "Survival" });
    const status = card.getByRole("status");
    const copied = card.getByText("Copied", { exact: true });
    await card.getByRole("button").click();
    await expect.poll(() => clipboard(page)).toBe(SURVIVAL);
    await expect(status).toHaveText(`Copied ${SURVIVAL}. Paste it in Play, Join game, Add server.`);
    await expect(copied).toHaveCSS("opacity", "1");
    expect(await overflowFindings(page)).toEqual([]);

    await page.clock.runFor(COPIED_FOR_MS);
    await expect(copied).toHaveCSS("opacity", "0");
    await expect(status).toBeEmpty();
  });
});

declare global {
  interface Window {
    realClipboard: Pick<Clipboard, "readText" | "writeText">;
  }
}

/** The clipboard as the browser has it, for the test to read and write behind the page's back. */
function keepTheRealClipboard() {
  const { clipboard } = navigator;
  window.realClipboard = {
    readText: clipboard.readText.bind(clipboard),
    writeText: clipboard.writeText.bind(clipboard)
  };
}

const REFUSALS = {
  "refuses to write": () => {
    Object.defineProperty(navigator.clipboard, "writeText", {
      value: () => Promise.reject(new DOMException("Denied", "NotAllowedError"))
    });
  },
  "has no clipboard": () => {
    Object.defineProperty(Navigator.prototype, "clipboard", { get: () => undefined });
  }
};

for (const [refusal, refuse] of Object.entries(REFUSALS)) {
  test.describe(`a browser that ${refusal}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(keepTheRealClipboard);
      await page.addInitScript(refuse);
    });

    test("is shown the hub's address to select by hand, and the clipboard keeps what it held", async ({
      page
    }) => {
      await page.goto("/");
      await page.evaluate(
        (held) => window.realClipboard.writeText(held),
        "what the visitor had copied"
      );
      const play = page.locator("#servers");
      await play.getByRole("button", { name: `Copy ${HUB}`, exact: true }).click();
      await expect(play.getByRole("status")).toHaveText(`Could not copy. The address is ${HUB}.`);
      await expect(play.getByText("Could not copy. Select the address")).toBeVisible();

      await play.getByText(HUB, { exact: true }).click();
      expect(await page.evaluate(() => getSelection()?.toString())).toBe(HUB);
      expect(await page.evaluate(() => window.realClipboard.readText())).toBe(
        "what the visitor had copied"
      );
    });

    test("is shown a gamemode's address in place of its player count", async ({ page }) => {
      await page.goto("/");
      const card = page.locator("#gamemodes").getByRole("listitem").filter({ hasText: "Survival" });
      await card.getByRole("button").click();
      await expect(card.getByRole("status")).toHaveText(
        `Could not copy. The address is ${SURVIVAL}.`
      );
      await expect(card.getByText(SURVIVAL, { exact: true })).toBeVisible();
    });

    test("is shown the hub's address in the pill, even on the narrowest phone", async ({
      page
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto("/blog");
      const pill = page.getByRole("banner").getByRole("button", { name: `Copy ${HUB}` });
      await pill.click();
      await expect(pill.getByText(HUB, { exact: true })).toBeVisible();
      expect(await overflowFindings(page)).toEqual([]);
    });
  });
}
