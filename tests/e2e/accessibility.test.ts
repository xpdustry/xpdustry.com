import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { layoutFindings } from "#tests/support/fit.ts";
import { focusFindings, ringStrength } from "#tests/support/focus.ts";
import { worstTextContrast } from "#tests/support/pixels.ts";
import { withoutShapes } from "#tests/support/shapes.ts";
import { expect, test, type Page } from "#tests/support/test.ts";

const AXE = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const TEXT_CONTRAST = 4.5;

const UNDECIDED_BY_AXE_AND_CHECKED_ELSEWHERE: Record<string, string> = {
  "color-contrast": "text over painted textures and photos, measured on rendered pixels below",
  "video-caption": "the one video has no sound track"
};

async function axeViolations(page: Page): Promise<string[]> {
  await page.evaluate(AXE);
  const { violations, undecided } = await page.evaluate(async () => {
    const { violations, incomplete } = await window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]
      },
      rules: { "label-content-name-mismatch": { enabled: true } },
      resultTypes: ["violations", "incomplete"]
    });
    return {
      violations: violations.flatMap(({ id, nodes }) =>
        nodes.map(({ target, failureSummary }) => `${id} on ${target.join(" ")}: ${failureSummary}`)
      ),
      undecided: incomplete.flatMap(({ id, nodes }) =>
        nodes.map(({ target }) => ({ id, where: target.join(" ") }))
      )
    };
  });
  await test.info().attach(`what axe could not decide on ${page.url()}`, {
    body: undecided
      .map(({ id, where }) => `${id} on ${where}: ${UNDECIDED_BY_AXE_AND_CHECKED_ELSEWHERE[id]}`)
      .join("\n")
  });
  return [
    ...violations,
    ...undecided
      .filter(({ id }) => !(id in UNDECIDED_BY_AXE_AND_CHECKED_ELSEWHERE))
      .map(({ id, where }) => `axe could not decide ${id} on ${where}, and nothing else checks it`)
  ];
}

declare global {
  interface Window {
    axe: typeof import("axe-core");
  }
}

test.describe("axe finds nothing", () => {
  for (const { path, width } of [
    { path: "/", width: 1280 },
    { path: "/blog", width: 390 },
    { path: "/fr/blog", width: 390 },
    { path: "/ru/blog", width: 390 },
    { path: "/blog/nohorny-4-beta-1", width: 1280 },
    { path: "/blog/nohorny-4-beta-8", width: 390 },
    { path: "/no-such-page", width: 1280 }
  ]) {
    test(`on ${path} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      expect(await axeViolations(page)).toEqual([]);
      if (!path.startsWith("/blog/")) return;
      await page.getByRole("button", { name: "phinner, open profile" }).click();
      await expect(page.getByRole("dialog", { name: "phinner" })).toBeVisible();
      expect(await axeViolations(page)).toEqual([]);
    });
  }

  test("on / at 390px, at rest, with the menu, a profile and a refused copy open", async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.addInitScript(() => {
      Object.defineProperty(navigator.clipboard, "writeText", {
        value: () => Promise.reject(new DOMException("Denied", "NotAllowedError"))
      });
    });
    await page.goto("/");
    const found: Record<string, string[]> = { rest: await axeViolations(page) };

    await page.getByRole("banner").getByRole("button", { name: "Menu" }).click();
    found.menu = await axeViolations(page);
    await page.keyboard.press("Escape");

    await page
      .locator("#team")
      .getByRole("button", { name: /^ZetaMap/ })
      .click();
    found.profile = await axeViolations(page);
    await page.keyboard.press("Escape");

    await page.locator("#servers").getByRole("button").first().click();
    await expect(page.locator("#servers").getByRole("status")).not.toBeEmpty();
    found.refused = await axeViolations(page);

    expect(found).toEqual({ rest: [], menu: [], profile: [], refused: [] });
  });
});

for (const [locale, copy] of [
  ["en", "Copy IP"],
  ["fr", "Copier l’IP"],
  ["ru", "Скопировать IP"]
] as const) {
  test(`the ${locale} phone header pill is named by the IP it shows`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto(locale === "en" ? "/blog" : `/${locale}/blog`);
    const pill = page.getByRole("banner").getByRole("button", { name: copy });
    await expect(pill.getByText("IP", { exact: true })).toBeVisible();
  });
}

test.describe("the keyboard sees where it is on every control it reaches", () => {
  for (const { path, width, reaches } of [
    {
      path: "/",
      width: 1280,
      reaches: [
        /^Skip to content$/,
        /^Copy hub/,
        /^Send a wave/,
        /^ZetaMap/,
        /Discord/,
        /^Back to top$/
      ]
    },
    { path: "/", width: 390, reaches: [/^Menu$/, /^Copy hub/, /^ZetaMap/, /^Back to top$/] },
    {
      path: "/blog/nohorny-4-beta-8",
      width: 390,
      reaches: [
        /^Blog$/,
        /^phinner, open profile$/,
        /^Copy link$/,
        /^Copy IP/,
        /Questions or feedback/,
        /^Back to top$/
      ]
    }
  ]) {
    test(`on ${path} at ${width}px`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      const { names, findings } = await focusFindings(page);
      for (const name of reaches) expect(names).toContainEqual(expect.stringMatching(name));
      expect(findings).toEqual([]);
    });
  }

  const controlsOnHome = (page: Page) => [
    page.getByRole("link", { name: "All posts" }),
    page.locator("#gamemodes").getByRole("button").first(),
    page.getByRole("link", { name: /Join our Discord/ }),
    page.getByRole("banner").getByRole("link", { name: "Blog" })
  ];

  test("on trays drawn without shape(), on a tray tab, a card and a header button", async ({
    page
  }) => {
    await withoutShapes(page);
    await page.goto("/");
    await page.keyboard.press("Tab");
    for (const control of controlsOnHome(page)) {
      await control.focus();
      const { changed, needed } = await ringStrength(page);
      expect(changed).toBeGreaterThanOrEqual(needed);
    }
  });

  test("under forced colours, in the system's Highlight", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/");
    await page.keyboard.press("Tab");
    for (const control of controlsOnHome(page)) {
      await control.focus();
      const ring = await control.evaluate((element) => {
        const probe = document.body.appendChild(document.createElement("i"));
        probe.style.color = "Highlight";
        const highlight = getComputedStyle(probe).color;
        probe.remove();
        return [
          getComputedStyle(element),
          getComputedStyle(element, "::before"),
          getComputedStyle(element.parentElement!)
        ].some(
          (style) =>
            style.outlineStyle === "solid" &&
            style.outlineWidth === "3px" &&
            style.outlineColor === highlight
        );
      });
      expect(ring).toBe(true);
    }
  });

  test("a control that sends Tab back up the page is a finding, not the end of it", async ({
    page
  }) => {
    test.setTimeout(120_000);
    await page.addInitScript(() =>
      document.addEventListener("keydown", (pressed) => {
        const firstTeammate = document.querySelector("#team button[popovertarget]");
        if (pressed.key !== "Tab" || document.activeElement !== firstTeammate) return;
        pressed.preventDefault();
        document.querySelector<HTMLElement>("#servers button")!.focus();
      })
    );
    await page.goto("/");
    const { names, findings } = await focusFindings(page);
    expect(names).not.toContainEqual("Back to top");
    expect(findings).toContainEqual(
      expect.stringMatching(/^after ZetaMap.* the keyboard goes back to Copy hub/)
    );
  });

  test("a ring painted in a transparent colour is no ring", async ({ page }) => {
    await page.goto("/");
    await page.addStyleTag({
      content:
        "*, *::before, *::after { outline-color: rgb(0 127 121 / 0) !important; box-shadow: none !important }"
    });
    await page.keyboard.press("Tab");
    const blog = page.getByRole("banner").getByRole("link", { name: "Blog" });
    await blog.focus();
    await expect(blog).toBeFocused();
    expect(await blog.evaluate((link) => link.matches(":focus-visible"))).toBe(true);
    const { changed, needed } = await ringStrength(page);
    expect(changed).toBeLessThan(needed);
  });
});

const tileTexts = async (page: Page) => {
  const tiles = page
    .locator("#more")
    .getByRole("link")
    .filter({ has: page.getByRole("heading") });
  await expect(tiles).toHaveCount(3);
  return (await tiles.all()).flatMap((tile) => [tile.getByRole("heading"), tile.locator("time")]);
};

const unpaintedIn = (page: Page, section: string) =>
  page
    .locator(section)
    .evaluate(
      (element) =>
        [...element.querySelectorAll<HTMLElement>("[data-paint]")].filter(
          (sprite) => !getComputedStyle(sprite).backgroundImage.includes("blob:")
        ).length
    );

test.describe("text keeps 4.5:1 to the pixels behind it", () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test("on a post tile, without the painter's worker", async ({ page }) => {
    await page.goto("/blog/nohorny-4-beta-3");
    for (const text of await tileTexts(page)) {
      expect(await worstTextContrast(text)).toBeGreaterThanOrEqual(TEXT_CONTRAST);
    }
  });

  test.describe("with every texture painted", () => {
    test.use({ paintsTextures: true, viewport: { width: 1280, height: 800 } });

    test("on the project and Discord cards, over their darkest patches", async ({ page }) => {
      await page.goto("/");
      const projects = page.locator("#projects");
      await projects.scrollIntoViewIfNeeded();
      await expect.poll(() => unpaintedIn(page, "#projects")).toBe(0);
      const texts = [
        ...(await projects.locator("a > p").all()),
        page.getByText("Events, announcements")
      ];
      expect(texts.length).toBeGreaterThan(3);
      for (const text of texts) {
        expect(await worstTextContrast(text)).toBeGreaterThanOrEqual(TEXT_CONTRAST);
      }
    });

    test("on a post tile and the post's Discord card", async ({ page }) => {
      await page.goto("/blog/nohorny-4-beta-3");
      await page.locator("#more").scrollIntoViewIfNeeded();
      await expect.poll(() => unpaintedIn(page, "main")).toBe(0);
      for (const text of [...(await tileTexts(page)), page.getByText("Join our Discord.")]) {
        expect(await worstTextContrast(text)).toBeGreaterThanOrEqual(TEXT_CONTRAST);
      }
    });
  });
});

test.describe("doubled text at 320px wraps where it would run under or past its neighbours", () => {
  test.use({ viewport: { width: 320, height: 800 } });

  for (const path of ["/fr", "/ru", "/ru/blog/nohorny-4-beta-8"]) {
    test(`on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.addStyleTag({ content: ":root { font-size: 200% }" });
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      expect(await layoutFindings(page)).toEqual([]);
    });
  }
});
