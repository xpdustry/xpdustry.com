import { expect, test, type Page } from "#tests/support/test.ts";

interface Transition {
  types: string[];
  pseudos: string[];
  names: string[];
  translated: string[];
  pageFadesMs: number;
  popoversShowing: number;
  outcome: "pending" | "ready" | "skipped";
}

declare global {
  interface Window {
    transitions: Transition[];
    holdTransitions?: boolean;
    arrival?: { inATransition: boolean; stillMoving: number };
  }
}

function recordViewTransitions() {
  window.transitions = [];
  const start = Object.getOwnPropertyDescriptor(Document.prototype, "startViewTransition");
  if (!start) return;
  type Start = Document["startViewTransition"];
  const transitionAnimations = () =>
    document
      .getAnimations()
      .filter((animation) =>
        (animation.effect as KeyframeEffect).pseudoElement?.startsWith("::view-transition")
      );
  Document.prototype.startViewTransition = new Proxy(start.value as Start, {
    apply(original, document: Document, args: Parameters<Start>) {
      const popoversShowing = document
        .getAnimations()
        .filter((animation) =>
          ((animation.effect as KeyframeEffect).target as Element | null)?.matches("[popover]")
        ).length;
      const transition = Reflect.apply(original, document, args) as ViewTransition;
      const recorded: Transition = {
        types: [...transition.types],
        pseudos: [],
        names: [],
        translated: [],
        pageFadesMs: 0,
        popoversShowing: popoversShowing + document.querySelectorAll(":popover-open").length,
        outcome: "pending"
      };
      window.transitions.push(recorded);
      transition.ready.then(
        () => {
          const animations = transitionAnimations();
          if (window.holdTransitions) for (const animation of animations) animation.pause();
          const effects = animations.map((animation) => animation.effect as KeyframeEffect);
          recorded.pseudos = [...new Set(effects.map((effect) => effect.pseudoElement!))];
          recorded.names = [
            ...new Set(recorded.pseudos.map((pseudo) => /\((.+)\)$/.exec(pseudo)![1]!))
          ];
          recorded.translated = effects
            .filter((effect) => effect.getKeyframes().some(({ translate }) => translate))
            .map((effect) => effect.pseudoElement!);
          recorded.pageFadesMs = Math.max(
            0,
            ...effects
              .filter((effect) =>
                /^::view-transition-(old|new)\((root|page)\)$/.test(effect.pseudoElement!)
              )
              .map((effect) => Number(effect.getComputedTiming().endTime))
          );
          recorded.outcome = "ready";
        },
        () => {
          recorded.outcome = "skipped";
        }
      );
      return transition;
    }
  });
}

function recordArrival() {
  const started: Animation[] = [];
  const animate = Object.getOwnPropertyDescriptor(Element.prototype, "animate")!;
  Element.prototype.animate = new Proxy(animate.value as Element["animate"], {
    apply(original, element: Element, args: Parameters<Element["animate"]>) {
      const animation = Reflect.apply(original, element, args) as Animation;
      started.push(animation);
      return animation;
    }
  });
  const revealed = new Promise<boolean>((done) =>
    addEventListener("pagereveal", (event) => done(Boolean(event.viewTransition)))
  );
  const parsed = new Promise((done) => addEventListener("DOMContentLoaded", done));
  void Promise.all([revealed, parsed]).then(([inATransition]) =>
    requestAnimationFrame(() => {
      window.arrival = {
        inATransition,
        stillMoving: started.filter(({ playState }) => playState === "running").length
      };
    })
  );
}

async function readyTransitions(page: Page, count: number): Promise<Transition[]> {
  await expect
    .poll(() =>
      page.evaluate(() => window.transitions.filter(({ outcome }) => outcome !== "pending").length)
    )
    .toBe(count);
  return page.evaluate(() => window.transitions);
}

const visit = async (page: Page, path: string) => {
  await page.addInitScript(recordViewTransitions);
  await page.goto(path);
  await page.waitForFunction(() => "hydrated" in document.documentElement.dataset);
};

const transitionsEnded = (page: Page) => page.waitForFunction(() => !document.activeViewTransition);

const play = (pseudos: string[]) =>
  pseudos.filter((pseudo) => /^::view-transition-(old|new)\(play\)$/.test(pseudo)).sort();

const PLAY_TRAVELS = ["::view-transition-new(play)", "::view-transition-old(play)"];

test.describe("for a visitor who allows motion", () => {
  test.use({ reducedMotion: "no-preference" });

  for (const { list, tiles } of [
    { list: "/", tiles: "#news" },
    { list: "/blog", tiles: "main" }
  ]) {
    test(`a tile on ${list} grows into its post's cover, which goes back into it even with the author's profile open`, async ({
      page
    }) => {
      await visit(page, list);
      const tile = page.locator(tiles).getByRole("link", { name: /Beta 7/ });
      await tile.scrollIntoViewIfNeeded();
      const listScroll = await page.evaluate(() => scrollY);

      await tile.click();
      await expect(page).toHaveURL(/\/blog\/nohorny-4-beta-7$/);
      const [opened] = await readyTransitions(page, 1);
      expect(opened!.outcome, "two elements of one page share a name").toBe("ready");
      expect(opened!.types).toEqual(["deeper", "post"]);
      expect(opened!.names).toEqual(
        expect.arrayContaining(["post-card-nohorny-4-beta-7", "post-title-nohorny-4-beta-7"])
      );
      await transitionsEnded(page);
      await page
        .getByRole("main")
        .getByRole("button", { name: /open profile$/ })
        .click();
      await expect(page.getByRole("dialog")).toBeVisible();

      await page.goBack();
      const [, closed] = await readyTransitions(page, 2);
      expect(closed!.outcome).toBe("ready");
      expect(closed!.types).toEqual(["shallower", "post"]);
      expect(closed!.popoversShowing, "the profile is shut before the cover is captured").toBe(0);
      expect(closed!.names).toContain("post-card-nohorny-4-beta-7");
      expect(closed!.names.filter((name) => !/^(root|page|play|post-.+)$/.test(name))).toEqual([]);
      expect(await page.evaluate(() => scrollY)).toBe(listScroll);
    });
  }

  test("only the arriving page slides, while the play address travels between the hero and the header or grows in place", async ({
    page
  }) => {
    await visit(page, "/");
    const nav = page.getByRole("navigation", { name: "Main" });
    await nav.getByRole("link", { name: "Blog" }).click();
    await readyTransitions(page, 1);
    await transitionsEnded(page);
    await nav.getByRole("link", { name: "Home" }).click();
    await readyTransitions(page, 2);
    await transitionsEnded(page);
    const news = page.locator("#news");
    await news.scrollIntoViewIfNeeded();
    await news.getByRole("link", { name: "All posts" }).click();
    await readyTransitions(page, 3);
    await transitionsEnded(page);
    await page.goBack();

    const transitions = await readyTransitions(page, 4);
    expect(transitions.map(({ types }) => types)).toEqual([
      ["deeper"],
      ["shallower"],
      ["deeper"],
      ["shallower"]
    ]);
    expect(transitions.map(({ pseudos }) => play(pseudos))).toEqual([
      PLAY_TRAVELS,
      PLAY_TRAVELS,
      ["::view-transition-new(play)"],
      ["::view-transition-old(play)"]
    ]);
    for (const { outcome, names, pseudos, translated } of transitions) {
      expect(outcome).toBe("ready");
      expect(translated).toEqual(["::view-transition-new(page)"]);
      expect(pseudos, "the page it leaves fades where it is").not.toContain(
        "::view-transition-old(page)"
      );
      expect(names.filter((name) => !["root", "page", "play"].includes(name))).toEqual([]);
    }
  });

  test("a click right after the page has faded in lands", async ({ page }) => {
    await visit(page, "/");
    await page.evaluate(() => {
      window.holdTransitions = true;
    });
    const nav = page.getByRole("navigation", { name: "Main" });
    const home = (await nav.getByRole("link", { name: "Home" }).boundingBox())!;
    await nav.getByRole("link", { name: "Blog" }).click();
    const [transition] = await readyTransitions(page, 1);

    await page.evaluate((fadedMs) => {
      for (const animation of document.getAnimations()) {
        const effect = animation.effect as KeyframeEffect;
        if (!effect.pseudoElement?.startsWith("::view-transition")) continue;
        if (Number(effect.getComputedTiming().endTime) <= fadedMs) animation.finish();
        else animation.currentTime = fadedMs;
      }
      const aFewFrames = new Promise((done) => setTimeout(done, 100));
      return Promise.race([document.activeViewTransition?.finished, aFewFrames]);
    }, transition!.pageFadesMs);
    await page.mouse.click(home.x + home.width / 2, home.y + home.height / 2);
    await expect(page).toHaveURL(/\/$/);
  });

  test("asking for less motion mid-morph stops it at once", async ({ page }) => {
    await visit(page, "/blog");
    await page.evaluate(() => {
      window.holdTransitions = true;
    });
    await page
      .getByRole("main")
      .getByRole("link", { name: /Beta 7/ })
      .click();
    const [held] = await readyTransitions(page, 1);
    expect(held!.pseudos.length).toBeGreaterThan(0);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await transitionsEnded(page);
  });

  test("switching language crossfades into a page that arrives at rest", async ({
    page,
    browserName
  }) => {
    test.skip(browserName !== "chromium", "Firefox has no view transition across documents");
    await page.addInitScript(recordArrival);
    await page.goto("/blog");
    await page.waitForFunction(() => "hydrated" in document.documentElement.dataset);
    await page.getByRole("button", { name: "Language: English" }).click();
    await page
      .getByRole("list", { name: "Language" })
      .getByRole("link", { name: "Français" })
      .click();

    await expect(page).toHaveURL(/\/fr\/blog$/);
    await expect
      .poll(() => page.evaluate(() => window.arrival))
      .toEqual({ inATransition: true, stillMoving: 0 });
  });

  test("a navigation that waits for its page says so, then captures the page as the visitor left it", async ({
    page
  }) => {
    let release!: () => void;
    const released = new Promise<void>((done) => (release = done));
    await page.route(/\/assets\/blog-[^/]*\.js$/, async (route) => {
      await released;
      await route.continue();
    });
    await visit(page, "/");
    const pendingBar = page.locator("[data-slow-navigation]");
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Blog" })
      .dispatchEvent("click");
    await page.waitForTimeout(150);
    await expect(pendingBar, "a quick navigation shows no bar").toHaveCount(0);
    await expect(pendingBar).toBeVisible();
    await page.locator("#team button[popovertarget]").first().click();
    await expect(page.locator(":popover-open")).toBeVisible();
    release();

    const [transition] = await readyTransitions(page, 1);
    expect(transition!.popoversShowing).toBe(0);
    expect(
      play(transition!.pseudos),
      "the hero was scrolled away, so the pill grows alone"
    ).toEqual(["::view-transition-new(play)"]);
    await expect(pendingBar).toHaveCount(0);
  });

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("the menu is shut in the page it leaves and the page it leads to", async ({ page }) => {
      await visit(page, "/");
      const menu = page.getByRole("button", { name: "Menu" });
      const nav = page.getByRole("navigation", { name: "Main" });
      await menu.click();
      await nav.getByRole("link", { name: "Blog" }).click();
      await readyTransitions(page, 1);
      await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
      await transitionsEnded(page);
      await menu.click();
      await expect(nav).toBeVisible();
      await expect.poll(() => nav.evaluate((open) => open.getAnimations().length)).toBe(0);
      await nav.getByRole("link", { name: "Home" }).click();

      const transitions = await readyTransitions(page, 2);
      for (const { outcome, pseudos, popoversShowing } of transitions) {
        expect(outcome).toBe("ready");
        expect(play(pseudos)).toEqual(PLAY_TRAVELS);
        expect(popoversShowing).toBe(0);
      }
      await expect(page.locator(":popover-open")).toHaveCount(0);
    });
  });
});

test("for a visitor who wants less motion, pages swap without moving", async ({ page }) => {
  await visit(page, "/blog");
  const heading = page.getByRole("heading", { level: 1 });
  await page
    .getByRole("main")
    .getByRole("link", { name: /Beta 7/ })
    .click();
  await expect(heading).toContainText("Automatic bans");
  await page.goBack();
  await expect(heading).toHaveText("Blog");

  const transitions = await readyTransitions(page, 2);
  expect(transitions.map(({ pseudos }) => pseudos)).toEqual([[], []]);
});
