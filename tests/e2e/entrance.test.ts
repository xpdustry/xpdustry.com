import { PAINT_NAMES } from "#app/textures/catalogue.ts";
import { holdTheClock } from "#tests/support/clock.ts";
import { expect as expectEventually, test, type Page } from "#tests/support/test.ts";

interface Entrance {
  animation: Animation;
  element: HTMLElement;
  kind: string;
  card: number | null;
  onFirstScreen: boolean;
}

declare global {
  interface Window {
    entrances: Entrance[];
    deliverPaintings: () => void;
  }
}

const STALL_DEADLINE_MS = 4000;
const RETRY_STEP_MS = 150;

/**
 * Waits on the condition alone, with no clock sized for an idle machine: a paint or an entrance
 * takes what the machine gives it, and only the test's own budget ends the wait.
 */
const expect = expectEventually.configure({ timeout: 0 });
test.use({ paintsTextures: true });
test.describe.configure({ timeout: 90_000 });
const RESTING_GROWTH = 0.45;
const THREADS_SHOW_AT = 0.25;
const SPRITE_OPENS_BY = 0.9;

function recordEntrances() {
  window.entrances = [];
  const cards: Element[] = [];
  const original = Object.getOwnPropertyDescriptor(Element.prototype, "animate")!;
  Element.prototype.animate = new Proxy(original.value as Element["animate"], {
    apply(animate, element: HTMLElement, [frames, options]: Parameters<Element["animate"]>) {
      const animation = Reflect.apply(animate, element, [frames, options]) as Animation;
      const texture = element.dataset.texture;
      if (!texture) return animation;
      const card = element.closest(".reveal");
      if (card && !cards.includes(card)) cards.push(card);
      const { top, bottom } = (card ?? element).getBoundingClientRect();
      const pseudo = typeof options === "object" ? (options.pseudoElement ?? "") : "";
      window.entrances.push({
        animation,
        element,
        kind: texture + pseudo,
        card: card ? cards.indexOf(card) : null,
        onFirstScreen: bottom > 0 && top < innerHeight
      });
      return animation;
    }
  });
}

/** Keeps what the painter's worker sends until the test calls `deliverPaintings`. */
function holdPaintings() {
  const kept: (() => void)[] = [];
  let holding = true;
  window.deliverPaintings = () => {
    holding = false;
    for (const deliver of kept.splice(0)) deliver();
  };
  const handler = Object.getOwnPropertyDescriptor(Worker.prototype, "onmessage")!;
  Object.defineProperty(Worker.prototype, "onmessage", {
    ...handler,
    set(this: Worker, show: ((event: MessageEvent) => void) | null) {
      handler.set!.call(
        this,
        show && ((event: MessageEvent) => (holding ? kept.push(() => show(event)) : show(event)))
      );
    }
  });
}

const stuckTextures = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[data-texture]")]
      .filter((element) => {
        const kind = element.dataset.texture!;
        const restsMasked = kind === "rise";
        const pseudos = kind === "backdrop" ? ["::before", "::after"] : [];
        const unrested = [undefined, ...pseudos].some((pseudo) => {
          const { opacity, maskImage, maskPosition, translate } = getComputedStyle(element, pseudo);
          const masked = !restsMasked && maskImage.includes("url(");
          const tornAside =
            restsMasked && maskPosition.split(",")[0]!.trim().split(" ")[1] !== "0px";
          return opacity === "0" || translate !== "none" || masked || tornAside;
        });
        const held = element
          .getAnimations({ subtree: true })
          .some(
            (animation) =>
              !(animation instanceof CSSAnimation || animation instanceof CSSTransition)
          );
        return unrested || held || "held" in element.dataset;
      })
      .map((element) => element.dataset.texture!)
      .concat("enter" in document.documentElement.dataset ? ["data-enter on <html>"] : [])
  );

/** The gamemode rows whose colour shows: drawn, and at least partly over its own row. */
const colouredRows = (page: Page) =>
  page.evaluate(
    () =>
      [...document.querySelectorAll<HTMLElement>('#gamemodes [data-texture="face"]')].filter(
        (face) => {
          const row = face.closest("li")!.getBoundingClientRect();
          const box = face.getBoundingClientRect();
          const drawn = getComputedStyle(face).opacity !== "0";
          return drawn && box.right > row.left + 8 && box.bottom > row.top + 8;
        }
      ).length
  );

const GAMEMODES = 5;

/** How many entrances are still paused, waiting for a texture; with `finish`, ends the rest. */
const heldEntrances = (page: Page, finish = false) =>
  page.evaluate((finish) => {
    const entrances = document
      .getAnimations()
      .filter(
        (animation) => !(animation instanceof CSSAnimation || animation instanceof CSSTransition)
      );
    if (finish) for (const entrance of entrances) entrance.finish();
    return entrances.filter((entrance) => entrance.playState === "paused").length;
  }, finish);

const unpainted = (page: Page) =>
  page.evaluate((names) => {
    const root = getComputedStyle(document.documentElement);
    return [
      ...names.filter((name) => !root.getPropertyValue(`--paint-${name}`).includes("blob:")),
      ...[...document.querySelectorAll<HTMLElement>("[data-paint]")]
        .filter((sprite) => {
          const style = getComputedStyle(sprite);
          const painted = (value: string) => value.includes("blob:");
          return !painted(style.getPropertyValue("--paint")) || !painted(style.backgroundImage);
        })
        .map((sprite) => sprite.dataset.paint!)
    ];
  }, PAINT_NAMES);

const howEntrancesEnded = (page: Page) =>
  page.evaluate(async () => {
    const waiting = () =>
      window.entrances.filter(({ animation }) => animation.playState !== "finished");
    while (waiting().some(({ animation }) => animation.playState !== "idle")) {
      await Promise.allSettled(waiting().map(({ animation }) => animation.finished));
    }
    return window.entrances.map(({ kind, animation }) => `${kind} ${animation.playState}`);
  });

async function enterHoldingTheClock(page: Page, path = "/") {
  await holdTheClock(page);
  await page.addInitScript(recordEntrances);
  await page.goto(path);
  await expect.poll(() => unpainted(page)).toEqual([]);
}

/**
 * Painted is not prepared: the entrance still decodes each image, then sets its keyframes and its
 * turn and plays it. Until then an animation is paused at its first keyframe.
 */
const waitUntilEveryEntranceIsPrepared = (page: Page) =>
  expect
    .poll(() =>
      page.evaluate(
        () => window.entrances.filter(({ animation }) => animation.playState === "paused").length
      )
    )
    .toBe(0);

/**
 * An entrance animating a property its element also transitions: Firefox restarts that transition
 * whenever the page restyles an element whose animation it throttles off screen.
 */
const entrancesOverTransitions = (page: Page) =>
  page.evaluate(() =>
    window.entrances.flatMap(({ kind, animation, element }) => {
      const effect = animation.effect as KeyframeEffect;
      const style = getComputedStyle(element, effect.pseudoElement);
      const durations = style.transitionDuration.split(", ");
      const transitioned = style.transitionProperty
        .split(", ")
        .filter((_, index) => Number.parseFloat(durations[index % durations.length]!) > 0);
      const kebab = (name: string) =>
        name.startsWith("--")
          ? name
          : name.replaceAll(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      const animated = new Set(
        effect
          .getKeyframes()
          .flatMap((frame) => Object.keys(frame))
          .filter((name) => !["offset", "computedOffset", "easing", "composite"].includes(name))
          .map(kebab)
      );
      return [...animated]
        .filter((name) => transitioned.includes(name) || transitioned.includes("all"))
        .map((name) => `${kind} animates ${name}, which it also transitions`);
    })
  );

for (const width of [1280, 390]) {
  test.describe(`at ${width}px with motion`, () => {
    test.use({ reducedMotion: "no-preference", viewport: { width, height: 800 } });

    // One visit for what only reads the entrance as it plays out: each step goes on from the last.
    test("the first screen's textures come in card by card, then leave nothing hidden, the page further down alone, and the hover working", async ({
      page
    }) => {
      await enterHoldingTheClock(page);
      await test.step("only the first screen's textures come in, card by card, blob by blob", async () => {
        await expect(page.locator("html")).not.toHaveAttribute("data-enter");
        const played = await page.evaluate(() =>
          window.entrances.map(({ kind, card, onFirstScreen }) => ({ kind, card, onFirstScreen }))
        );
        const kinds = [...new Set(played.map(({ kind }) => kind))].sort();
        const gamemodesOnFirstScreen = width === 1280 ? ["face"] : [];
        expect(kinds).toEqual([
          "backdrop::after",
          "backdrop::before",
          "drop",
          ...gamemodesOnFirstScreen,
          "grow",
          "grown"
        ]);
        expect(played.filter(({ onFirstScreen }) => !onFirstScreen)).toEqual([]);
        expect(new Set(played.map(({ card }) => card)).size).toBeGreaterThan(2);
        expect(await entrancesOverTransitions(page)).toEqual([]);
      });
      await test.step("every entrance ends, and nothing stays hidden", async () => {
        const ended = await howEntrancesEnded(page);
        expect(ended.filter((entrance) => !entrance.endsWith(" finished"))).toEqual([]);
        expect(await stuckTextures(page)).toEqual([]);
      });
      await test.step("further down, textures and the bands' frayed edges paint with the page", async () => {
        const before = await page.evaluate(() => window.entrances.length);
        await page.getByRole("contentinfo").scrollIntoViewIfNeeded();
        await expect.poll(() => stuckTextures(page)).toEqual([]);
        expect(await page.evaluate(() => window.entrances.length)).toBe(before);
        expect(
          await page.evaluate(() => ({
            edges: document.querySelectorAll("#gamemodes [data-paint]").length > 0,
            ridges: document.querySelectorAll('footer > div[aria-hidden="true"]').length,
            marked: document.querySelectorAll("footer [data-texture]").length,
            entered: window.entrances.filter(({ element }) => element.closest("#news, footer"))
              .length
          }))
        ).toEqual({ edges: true, ridges: 1, marked: 0, entered: 0 });
      });
      await test.step("the play card's blobs rest, then grow on hover", async () => {
        const play = page.getByRole("button", { name: "Copy hub.md.xpdustry.com", exact: true });
        const grown = () =>
          play.evaluate((cover) =>
            [...cover.parentElement!.querySelectorAll('[data-texture="grown"]')].map((sprite) =>
              getComputedStyle(sprite).getPropertyValue("--grow")
            )
          );
        await expect.poll(grown).toEqual(expect.arrayContaining([String(RESTING_GROWTH)]));
        expect(new Set(await grown())).toEqual(new Set([String(RESTING_GROWTH)]));
        await page.clock.resume();
        await play.hover({ position: { x: 24, y: 24 } });
        await expect.poll(async () => new Set(await grown())).toEqual(new Set(["1"]));
      });
    });

    test("a gamemode row shows no colour until its edge is painted, then the colour comes in behind it", async ({
      page
    }) => {
      await holdTheClock(page);
      await page.addInitScript(holdPaintings);
      await page.addInitScript(recordEntrances);
      await page.goto("/");
      await page.locator("#gamemodes").scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      expect(await colouredRows(page)).toBe(0);

      await page.evaluate(() => window.deliverPaintings());
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              window.entrances.filter(
                ({ kind, animation }) => kind === "face" && animation.playState !== "paused"
              ).length
          )
        )
        .toBeGreaterThan(0);
      const sliding = await page.evaluate(async () => {
        const unpaintedEdges = (face: HTMLElement) =>
          [...face.querySelectorAll<HTMLElement>("[data-paint]"), face.lastElementChild!]
            .filter((edge) => edge.getClientRects().length)
            .filter((edge) => {
              const { backgroundImage, maskImage } = getComputedStyle(edge);
              return !`${backgroundImage} ${maskImage}`.includes("blob:");
            }).length;
        const faces = window.entrances.filter(({ kind }) => kind === "face");
        for (const { animation } of faces) animation.pause();
        await Promise.all(faces.map(({ animation }) => animation.ready));
        return faces.map(({ animation, element }) => {
          const { delay = 0, duration } = animation.effect!.getTiming();
          const at = (fraction: number) => {
            animation.currentTime = Number(delay) + Number(duration) * fraction;
            return element.getBoundingClientRect();
          };
          const resting = at(1);
          const away = (fraction: number) => {
            const { x, y } = at(fraction);
            return Math.hypot(x - resting.x, y - resting.y);
          };
          const [start, midway] = [away(0), away(0.4)];
          return { start, midway, unpainted: unpaintedEdges(element) };
        });
      });
      expect(sliding.length).toBeGreaterThan(0);
      for (const { start, midway, unpainted } of sliding) {
        expect(midway).toBeGreaterThan(8);
        expect(midway).toBeLessThan(start);
        expect(unpainted).toBe(0);
      }
      expect(await colouredRows(page)).toBeGreaterThan(0);

      await page.evaluate(() => {
        for (const { animation } of window.entrances) animation.finish();
      });
      await expect.poll(() => colouredRows(page)).toBe(GAMEMODES);
      expect(await stuckTextures(page)).toEqual([]);
    });

    test("a blob grows in through threads, and its sprite opens to where it rests", async ({
      page
    }) => {
      await enterHoldingTheClock(page);
      await waitUntilEveryEntranceIsPrepared(page);
      const midway = await page.evaluate(
        async ({ threadsAt, opensBy }) => {
          const seek = ({ animation }: Entrance, fraction: number) => {
            const { delay = 0, duration } = animation.effect!.getTiming();
            animation.currentTime = Number(delay) + Number(duration) * fraction;
          };
          /** Where the sprite's mask turns clear, as the browser resolved it: 0 shut, 1 open. */
          const openedTo = (element: Element) =>
            Number(/([\d.]+)%\)$/.exec(getComputedStyle(element).maskImage)?.[1]) / 100;
          const growing = window.entrances.filter(({ kind }) => kind === "grow");
          const opening = window.entrances.filter(({ kind }) => kind === "grown");
          // Firefox pauses on the next frame, which would undo a seek made before it.
          for (const { animation } of [...growing, ...opening]) animation.pause();
          await Promise.all([...growing, ...opening].map(({ animation }) => animation.ready));
          for (const entrance of growing) seek(entrance, threadsAt);
          for (const entrance of opening) seek(entrance, opensBy);
          return {
            inThreads: growing.filter(({ element }) => {
              const { maskImage, maskSize } = getComputedStyle(element);
              const tile = `${element.dataset.tile}px`;
              return maskImage.includes("url(") && maskSize.includes(`${tile} ${tile}`);
            }).length,
            blobs: growing.length,
            opened: opening.map(({ element }) => openedTo(element)),
            rested: opening.map(({ animation, element }) => {
              const { delay = 0, duration } = animation.effect!.getTiming();
              animation.currentTime = Number(delay) + Number(duration);
              return openedTo(element);
            })
          };
        },
        { threadsAt: THREADS_SHOW_AT, opensBy: SPRITE_OPENS_BY }
      );
      expect(midway.blobs).toBeGreaterThan(0);
      expect(midway.inThreads).toBe(midway.blobs);
      expect(midway.opened.length).toBeGreaterThan(0);
      for (const open of midway.opened) {
        expect(open).toBeGreaterThan(0.2);
        expect(open).toBeLessThan(RESTING_GROWTH);
      }
      expect(midway.rested).toEqual(midway.opened.map(() => RESTING_GROWTH));
    });
  });
}

test.describe("with motion on other pages", () => {
  test.use({ reducedMotion: "no-preference" });

  test("a post has an entrance that leaves nothing hidden", async ({ page }) => {
    await enterHoldingTheClock(page, "/blog/nohorny-4-beta-8");
    expect((await howEntrancesEnded(page)).length).toBeGreaterThan(0);
    expect(await stuckTextures(page)).toEqual([]);
  });

  test("home, then the blog, then Back: the home page comes back painted, nothing hidden", async ({
    page
  }) => {
    await enterHoldingTheClock(page);
    await howEntrancesEnded(page);
    await page.goto("/blog");
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(() => unpainted(page)).toEqual([]);
    await howEntrancesEnded(page);
    expect(await stuckTextures(page)).toEqual([]);
  });
});

test.describe("with motion", () => {
  test.use({ reducedMotion: "no-preference" });

  test("a browser without the animation API paints every texture at once", async ({ page }) => {
    await page.addInitScript(() => {
      Reflect.deleteProperty(Element.prototype, "animate");
    });
    await page.goto("/");
    await expect.poll(() => unpainted(page)).toEqual([]);
    expect(await stuckTextures(page)).toEqual([]);
  });

  for (const [failure, fail] of [
    [
      "cannot load the painter's worker",
      (page: Page) => page.route(/painter\.worker/, (route) => route.abort())
    ],
    [
      "has no workers",
      (page: Page) =>
        page.addInitScript(() => {
          Reflect.deleteProperty(globalThis, "Worker");
        })
    ]
  ] as const) {
    test(`a browser that ${failure} shows every texture without waiting for the stall deadline`, async ({
      page
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await holdTheClock(page);
      await fail(page);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      let elapsedMs = 0;
      await expect
        .poll(async () => {
          if (elapsedMs + RETRY_STEP_MS < STALL_DEADLINE_MS) {
            await page.clock.runFor(RETRY_STEP_MS);
            elapsedMs += RETRY_STEP_MS;
          }
          return heldEntrances(page);
        })
        .toBe(0);
      await heldEntrances(page, true);
      expect(await stuckTextures(page)).toEqual([]);
      expect(errors).toEqual([]);
    });
  }

  test("asking for less motion mid-entrance rests every entrance at once", async ({ page }) => {
    await holdTheClock(page);
    await page.addInitScript(holdPaintings);
    await page.addInitScript(recordEntrances);
    await page.goto("/");
    await page.evaluate(() => window.deliverPaintings());
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.entrances.some(
            ({ kind, animation }) => kind === "face" && animation.playState === "running"
          )
        )
      )
      .toBe(true);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(100);
    const moving = await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter(
            (animation) =>
              !(animation instanceof CSSAnimation || animation instanceof CSSTransition) &&
              animation.playState === "running"
          ).length
    );
    expect(moving).toBe(0);
    await expect.poll(() => stuckTextures(page)).toEqual([]);
  });

  test("a stalled painter holds the textures for four seconds, then lets them go", async ({
    page
  }) => {
    await holdTheClock(page);
    await page.route(/painter\.worker/, () => {});
    await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(await stuckTextures(page)).not.toEqual([]);
    await page.clock.runFor(STALL_DEADLINE_MS - 100);
    expect(await stuckTextures(page)).not.toEqual([]);
    await page.clock.runFor(200);
    await expect.poll(() => stuckTextures(page)).toEqual([]);
  });
});

test.describe("for a visitor who wants less motion", () => {
  test("nothing enters, and nothing stays hidden", async ({ page }) => {
    await page.addInitScript(recordEntrances);
    await page.goto("/");
    await expect.poll(() => unpainted(page)).toEqual([]);
    expect(await page.evaluate(() => window.entrances.length)).toBe(0);
    expect(await stuckTextures(page)).toEqual([]);
  });

  test("a gamemode row shows its colour once its edge is painted, even scrolled to early", async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await holdTheClock(page);
    await page.addInitScript(holdPaintings);
    await page.addInitScript(recordEntrances);
    await page.goto("/");
    await page.locator("#gamemodes").scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    expect(await colouredRows(page)).toBe(0);
    await page.evaluate(() => window.deliverPaintings());
    await expect.poll(() => colouredRows(page)).toBe(GAMEMODES);
    expect(await page.evaluate(() => window.entrances.length)).toBe(0);
  });

  test("a stalled painter holds the gamemode colour until the deadline", async ({ page }) => {
    await holdTheClock(page);
    await page.route(/painter\.worker/, () => {});
    await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(await colouredRows(page)).toBe(0);
    await page.clock.runFor(STALL_DEADLINE_MS + 100);
    await expect.poll(() => colouredRows(page)).toBe(GAMEMODES);
  });
});

test.describe("a browser that runs no scripts", () => {
  test.use({ javaScriptEnabled: false, reducedMotion: "no-preference" });

  test("hides nothing", async ({ page, browserName }) => {
    test.skip(
      browserName === "firefox",
      "Playwright cannot evaluate in a Firefox page whose scripts are off"
    );
    await page.goto("/");
    expect(await stuckTextures(page)).toEqual([]);
  });
});
