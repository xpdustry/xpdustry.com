import { expect, test, type Page } from "#tests/support/test.ts";

/** The house's touch target, the one `src/ui/styles/touch.ts` grows controls to. */
const TOUCH_TARGET = 44;
/** Grid spacing in px: fine enough that no strip of a neighbour two px wide slips between points. */
const STEP = 2;

declare global {
  interface Window {
    motions: string[];
  }
}

/**
 * Each header and footer control a fingertip would miss somewhere in the 44 px box centred on
 * its drawing: a point of the box's grid where the page hands the tap to something else.
 */
const missedTaps = (page: Page) =>
  page.evaluate(
    async ({ half, step }) => {
      /** The middle of what is drawn: the control and all it holds, a plinth's raised face too. */
      const middle = (control: Element) => {
        const drawn = [control, ...control.querySelectorAll("*")]
          .map((part) => part.getBoundingClientRect())
          .filter(({ width }) => width > 0);
        const across = (from: "left" | "top", to: "right" | "bottom") =>
          (Math.min(...drawn.map((box) => box[from])) + Math.max(...drawn.map((box) => box[to]))) /
          2;
        return [across("left", "right"), across("top", "bottom")] as const;
      };
      const misses = (control: Element, [x, y]: readonly [number, number]) => {
        const missed: string[] = [];
        for (let dx = step / 2 - half; dx < half; dx += step) {
          for (let dy = step / 2 - half; dy < half; dy += step) {
            const at = document.elementFromPoint(x + dx, y + dy);
            if (!at || !control.contains(at)) missed.push(`${dx},${dy}`);
          }
        }
        return missed;
      };
      const controls = [
        ...document.querySelectorAll<HTMLElement>(
          "header a, header button, footer a, footer button"
        )
      ].filter(
        (control) =>
          control.checkVisibility({ visibilityProperty: true }) &&
          control.getAttribute("aria-hidden") !== "true" &&
          control.getBoundingClientRect().width > 0
      );
      const found: string[] = [];
      for (const control of controls) {
        control.scrollIntoView({ block: "center", behavior: "instant" });
        await new Promise((done) => requestAnimationFrame(() => done(undefined)));
        const missed = misses(control, middle(control));
        const name = control.getAttribute("aria-label") ?? control.textContent?.trim().slice(0, 30);
        if (missed.length > 0)
          found.push(`${name} misses ${missed.length} points, first ${missed[0]}`);
      }
      return found;
    },
    { half: TOUCH_TARGET / 2, step: STEP }
  );

for (const width of [390, 320]) {
  test.describe(`on a ${width}px touch screen`, () => {
    test.use({ viewport: { width, height: 800 }, hasTouch: true, isMobile: true });

    test("every header and footer control takes a whole fingertip, and none covers another", async ({
      page
    }) => {
      await page.goto("/");
      expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
      expect(await missedTaps(page)).toEqual([]);
    });
  });
}

/** Records every animation and transition the page starts, by what it moves. */
function recordMotion() {
  window.motions = [];
  const name = (target: EventTarget | null) =>
    target instanceof Element
      ? `${target.tagName.toLowerCase()}${target.id ? `#${target.id}` : ""}`
      : "?";
  for (const event of ["transitionrun", "animationstart"] as const) {
    addEventListener(
      event,
      (started) => {
        const property =
          started instanceof TransitionEvent ? started.propertyName : started.animationName;
        window.motions.push(`${event} ${property} on ${name(started.target)}`);
      },
      true
    );
  }
  const animate = Object.getOwnPropertyDescriptor(Element.prototype, "animate")!;
  Element.prototype.animate = new Proxy(animate.value as Element["animate"], {
    apply(original, element: Element, args: Parameters<Element["animate"]>) {
      window.motions.push(`animate() on ${name(element)}`);
      return Reflect.apply(original, element, args) as Animation;
    }
  });
}

test.describe("for a visitor who wants less motion", () => {
  test.use({ reducedMotion: "reduce" });

  for (const width of [1280, 390]) {
    test(`nothing on the home page moves at ${width}px, whatever they press`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.addInitScript(recordMotion);
      await page.goto("/");
      const banner = page.getByRole("banner");
      // Below 520px the language list is in the menu.
      const opens = width < 520 ? "Menu" : /^Language/;
      await banner.getByRole("button", { name: opens }).click();
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Xpdustry", exact: true }).click();
      await page.locator("#gamemodes").getByRole("listitem").first().getByRole("button").click();
      await page.locator("#projects").getByRole("link").first().hover();
      await page
        .locator("#team")
        .getByRole("button", { name: /^ZetaMap/ })
        .click();
      await expect(page.getByRole("dialog", { name: "ZetaMap" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      expect(await page.evaluate(() => window.motions)).toEqual([]);
    });
  }
});
