import { holdTheClock } from "#tests/support/clock.ts";
import { expect as expectEventually, test, type Locator, type Page } from "#tests/support/test.ts";

test.use({ reducedMotion: "no-preference", paintsTextures: true });

/**
 * Waits on the condition alone: a spread takes what the machine gives it, and only the test's
 * budget ends the wait.
 */
const expect = expectEventually.configure({ timeout: 0 });
test.describe.configure({ timeout: 90_000 });

const PAST_THE_CORNER = 120;
const WAVE_BAND = 240;
const COPIED_FOR_MS = 1400;
const COVERED_FADES_BELOW = 0.3;

declare global {
  interface Window {
    heldGrowths: Animation[];
    holdingDone?: boolean;
    spreadFrames: SpreadFrame[];
  }
}

interface SpreadState {
  /** `current`, `covered` or `idle`. */
  role: string;
  front: number;
  hole: number;
  opacity: number;
  growing: boolean;
}

/** One spread in one animation frame, as the product played it. */
interface SpreadFrame extends SpreadState {
  spread: number;
  /** The opacity of its solid layer, the first to go when it dissolves. */
  solid: number;
}

/**
 * Spreads are read through their card: once a wave has played, a locator that resolves to the
 * spreads themselves crashes the page in Playwright 1.65's Firefox.
 */
const statesOf = (card: Locator): Promise<SpreadState[]> =>
  card.evaluate((element) =>
    [...element.querySelectorAll<HTMLElement>(":scope > [data-spread]")].map((spread) => {
      const style = getComputedStyle(spread);
      return {
        role: spread.dataset.spread!,
        front: Number.parseFloat(style.getPropertyValue("--spread")),
        hole: Number.parseFloat(style.getPropertyValue("--spread-hole")),
        opacity: Number(style.opacity),
        growing: spread.getAnimations().some((animation) => animation instanceof CSSAnimation)
      };
    })
  );

/** How many spreads on the card still move, a dissolve included. */
const sweeping = (card: Locator) =>
  card.evaluate(
    (element) =>
      [...element.querySelectorAll(":scope > [data-spread]")].filter(
        (spread) => spread.getAnimations().length > 0
      ).length
  );

/** Pauses each spread's growth in the frame it starts, however late the machine runs. */
const holdEveryGrowthFrom = (card: Locator) =>
  card.evaluate((element: HTMLElement) => {
    window.heldGrowths = [];
    element.addEventListener("animationstart", (event) => {
      const spread = event.target as HTMLElement;
      if (spread.parentElement !== element || !("spread" in spread.dataset)) return;
      const growth = spread
        .getAnimations()
        .find(
          (animation) =>
            animation instanceof CSSAnimation && animation.animationName === event.animationName
        );
      if (!growth || window.heldGrowths.includes(growth) || window.holdingDone) return;
      growth.pause();
      window.heldGrowths.push(growth);
    });
  });

/**
 * Pauses the dissolve's transitions as they are made: they run on the real clock, and a frame on a
 * busy machine can outlast the solid layer's fade, so waiting for `transitionrun` comes too late.
 * The observer runs in the microtask after the class changes, before any frame, and asking for
 * the animations makes the browser create the transitions there and then.
 */
const holdEveryDissolveIn = (card: Locator) =>
  card.evaluate((element: HTMLElement) => {
    new MutationObserver(() => {
      for (const animation of element.getAnimations({ subtree: true })) {
        if (animation instanceof CSSTransition) animation.pause();
      }
    }).observe(element, { subtree: true, attributes: true, attributeFilter: ["class"] });
  });

async function pressHoldingItsGrowth(page: Page, press: () => Promise<void>) {
  const held = await page.evaluate(() => window.heldGrowths.length);
  await press();
  await expect.poll(() => page.evaluate(() => window.heldGrowths.length)).toBe(held + 1);
  await page.evaluate(() => Promise.all(window.heldGrowths.map((growth) => growth.ready)));
  return held;
}

/** Where a held growth's spread stands at its very start, and at a fraction of the way. */
const radiusAt = (page: Page, index: number, fraction = 0) =>
  page.evaluate(
    ([index, fraction]) => {
      const growth = window.heldGrowths[index]!;
      growth.currentTime = Number(growth.effect!.getComputedTiming().duration) * fraction;
      const spread = (growth.effect as KeyframeEffect).target!;
      return getComputedStyle(spread).getPropertyValue("--spread");
    },
    [index, fraction] as const
  );

/** A held growth's spread: its role, and whether the growth is still on it. */
const coveredBy = (page: Page, index: number) =>
  page.evaluate((index) => {
    const growth = window.heldGrowths[index]!;
    const spread = (growth.effect as KeyframeEffect).target as HTMLElement;
    return {
      role: spread.dataset.spread,
      attached: spread.getAnimations().includes(growth)
    };
  }, index);

async function pressAndWaitForANewSpread(card: Locator, press: () => Promise<void>) {
  const before = (await statesOf(card)).length;
  await press();
  await expect.poll(async () => (await statesOf(card)).length).toBe(before + 1);
}

/**
 * Records every spread on the card in every frame the browser renders, from now on. The spreads
 * run on the real clock and on their own: nothing here pauses, seeks or finishes them.
 */
const recordFrames = (card: Locator) =>
  card.evaluate((element) => {
    const ids = new WeakMap<Element, number>();
    let count = 0;
    window.spreadFrames = [];
    const sample = () => {
      for (const spread of element.querySelectorAll<HTMLElement>(":scope > [data-spread]")) {
        if (!ids.has(spread)) ids.set(spread, count++);
        const style = getComputedStyle(spread);
        window.spreadFrames.push({
          spread: ids.get(spread)!,
          role: spread.dataset.spread!,
          front: Number.parseFloat(style.getPropertyValue("--spread")),
          hole: Number.parseFloat(style.getPropertyValue("--spread-hole")),
          opacity: Number(style.opacity),
          solid: Number(getComputedStyle(spread.firstElementChild!).opacity),
          growing: spread.getAnimations().some((animation) => animation instanceof CSSAnimation)
        });
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });

const framesOf = (page: Page) => page.evaluate(() => window.spreadFrames);
const ofSpread = (frames: SpreadFrame[], spread: number) =>
  frames.filter((frame) => frame.spread === spread);
/** The spreads that grew while recording, in order: the card also holds an idle one from the start. */
const grownSpreads = (frames: SpreadFrame[]) => [
  ...new Set(frames.filter(({ growing }) => growing).map(({ spread }) => spread))
];
const neverFalls = (values: number[]) =>
  values.every((value, i) => i === 0 || value >= values[i - 1]!);
const neverRises = (values: number[]) =>
  values.every((value, i) => i === 0 || value <= values[i - 1]!);

/** Waits until every spread on the card has come to rest, by itself. */
const untilAtRest = (card: Locator) => expect.poll(() => sweeping(card)).toBe(0);

async function pvpCard(page: Page, { holdGrowths = true } = {}) {
  await page.goto("/");
  const card = page.locator("#gamemodes").getByRole("listitem").filter({ hasText: "PvP" });
  await card.scrollIntoViewIfNeeded();
  if (holdGrowths) await holdEveryGrowthFrom(card);
  const box = (await card.boundingBox())!;
  const x = (fraction: number) => box.width * fraction;
  const y = box.height / 2;
  return {
    card,
    press: (fraction: number) =>
      card.getByRole("button").click({ position: { x: x(fraction), y } }),
    reachFrom: (fraction: number) =>
      Math.hypot(Math.max(x(fraction), box.width - x(fraction)), Math.max(y, box.height - y)) +
      PAST_THE_CORNER
  };
}

async function introduction(page: Page, { holdGrowths = true } = {}) {
  await page.goto("/");
  const logo = page.getByRole("button", { name: "Xpdustry", exact: true });
  const card = page.locator("section").filter({ has: logo });
  if (holdGrowths) await holdEveryGrowthFrom(card);
  const cardBox = (await card.boundingBox())!;
  const logoBox = (await logo.boundingBox())!;
  const x = logoBox.x + logoBox.width / 2 - cardBox.x;
  const y = logoBox.y + logoBox.height / 2 - cardBox.y;
  const farthestCorner = Math.hypot(
    Math.max(x, cardBox.width - x),
    Math.max(y, cardBox.height - y)
  );
  return { logo, card, farthestCorner };
}

test.describe("held at known moments", () => {
  test.beforeEach(async ({ page }) => {
    await holdTheClock(page);
  });

  test("a press on a dissolving spread starts a new one from nothing over it", async ({ page }) => {
    const { card, press, reachFrom } = await pvpCard(page, { holdGrowths: false });
    await press(0.5);
    await expect(card.getByRole("status")).not.toBeEmpty();
    await expect
      .poll(async () => (await statesOf(card)).some((spread) => spread.growing))
      .toBe(false);
    await holdEveryDissolveIn(card);
    await page.clock.runFor(COPIED_FOR_MS);
    await expect(card.getByRole("status")).toBeEmpty();

    await holdEveryGrowthFrom(card);
    const growth = await pressHoldingItsGrowth(page, () => press(0.2));
    const [stillDissolving, newest] = (await statesOf(card)).slice(-2);
    expect(stillDissolving).toMatchObject({ role: "covered", growing: false });
    expect(stillDissolving!.front).toBeCloseTo(reachFrom(0.5), -1);
    expect(newest).toMatchObject({ role: "current", growing: true });
    expect(await radiusAt(page, growth)).toBe("0px");
  });

  test("the logo sweeps for a key press too", async ({ page }) => {
    const { logo, card } = await introduction(page);
    await logo.focus();
    const wave = await pressHoldingItsGrowth(page, () => page.keyboard.press("Enter"));
    await radiusAt(page, wave, 0.25);
    const state = (await statesOf(card)).at(-1)!;
    expect(state.role).toBe("current");
    expect(state.front - state.hole).toBeCloseTo(WAVE_BAND, 0);
  });
});

test.describe("on their own", () => {
  test("a spread grows out past the corner, then dissolves solid first and is gone once the copy is confirmed", async ({
    page
  }) => {
    const { card, press, reachFrom } = await pvpCard(page, { holdGrowths: false });
    await recordFrames(card);
    await press(0.05);
    await expect(card.getByRole("status")).not.toBeEmpty();
    await expect(card.getByRole("status")).toBeEmpty();
    await untilAtRest(card);
    await expect
      .poll(async () => new Set((await statesOf(card)).map(({ opacity }) => opacity)))
      .toEqual(new Set([0]));

    const frames = await framesOf(page);
    const [spread] = grownSpreads(frames);
    const own = ofSpread(frames, spread!);
    const grown = own.filter(({ growing }) => growing).map(({ front }) => front);
    expect(grown.length).toBeGreaterThan(1);
    expect(neverFalls(grown)).toBe(true);
    expect(grown.at(-1)).toBeGreaterThan(grown[0]!);
    const lastGrowing = own.findLastIndex(({ growing }) => growing);
    expect(own[lastGrowing + 1]!.front).toBeCloseTo(reachFrom(0.05), -1);
    expect(own.some(({ opacity, solid }) => opacity === 1 && solid === 0)).toBe(true);
    expect(own.at(-1)!.opacity).toBe(0);
  });

  test("a press while a spread grows starts one from nothing over it, and the covered one grows on beneath as it fades", async ({
    page
  }) => {
    const { card, press } = await pvpCard(page);
    await recordFrames(card);
    const first = await pressHoldingItsGrowth(page, () => press(0.05));
    expect(await radiusAt(page, first)).toBe("0px");
    // The first grows on from the moment the second mounts, so it grows as it fades; the second
    // stays held at its start.
    await card.evaluate((element, first) => {
      new MutationObserver((_, observer) => {
        observer.disconnect();
        window.heldGrowths[first]!.play();
      }).observe(element, { childList: true });
    }, first);
    const second = await pressHoldingItsGrowth(page, () => press(0.95));
    expect(await coveredBy(page, first)).toEqual({ role: "covered", attached: true });
    expect(await radiusAt(page, second)).toBe("0px");
    await page.evaluate((second) => {
      window.holdingDone = true;
      window.heldGrowths[second]!.play();
    }, second);
    await expect
      .poll(async () =>
        (await framesOf(page)).some(
          ({ role, opacity, growing }) =>
            role === "covered" && growing && opacity < COVERED_FADES_BELOW
        )
      )
      .toBe(true);

    const frames = await framesOf(page);
    const [covered] = grownSpreads(frames);
    const beneath = ofSpread(frames, covered!).filter(({ role }) => role === "covered");
    const fronts = beneath.filter(({ growing }) => growing).map(({ front }) => front);
    expect(neverFalls(fronts)).toBe(true);
    expect(fronts.at(-1)).toBeGreaterThan(fronts[0]!);
    expect(neverRises(beneath.map(({ opacity }) => opacity))).toBe(true);
  });

  test("the logo's waves sweep a band of threads off the card and leave it as it was", async ({
    page
  }) => {
    const { logo, card, farthestCorner } = await introduction(page, { holdGrowths: false });
    await recordFrames(card);
    await logo.click();
    await expect
      .poll(async () => (await framesOf(page)).some(({ growing, front }) => growing && front > 0))
      .toBe(true);
    await logo.click();
    await expect.poll(async () => grownSpreads(await framesOf(page)).length).toBe(2);
    await untilAtRest(card);

    const frames = await framesOf(page);
    for (const wave of grownSpreads(frames)) {
      const own = ofSpread(frames, wave);
      const swept = own.filter(({ growing }) => growing);
      expect(swept.length).toBeGreaterThan(1);
      expect(neverFalls(swept.map(({ front }) => front))).toBe(true);
      expect(swept.at(-1)!.front).toBeGreaterThan(swept[0]!.front);
      expect(new Set(swept.map(({ front, hole }) => Math.round(front - hole)))).toEqual(
        new Set([WAVE_BAND])
      );
      expect(own.at(-1)!.hole).toBeGreaterThanOrEqual(farthestCorner);
    }
  });
});

test.describe("for a visitor who wants less motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("pressing the logo changes nothing on the card", async ({ page }) => {
    const { logo, card } = await introduction(page);
    await pressAndWaitForANewSpread(card, () => logo.click());
    expect(await sweeping(card)).toBe(0);
  });
});
