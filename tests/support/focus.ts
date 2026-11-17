import type { Page } from "playwright/test";
import { wcagContrast } from "./contrast.ts";
import { padded, shoot, type Box } from "./pixels.ts";

const FOCUS_CONTRAST = 3;
const RING_REACH = 10;
const RING_THICKNESS = 2;
const MAX_STOPS = 200;

interface Focused {
  stop: number;
  name: string;
  covered: boolean;
}

declare global {
  interface Window {
    stops: Element[];
    ringed: HTMLElement;
  }
}

const focused = (page: Page) =>
  page.evaluate((): Focused | undefined => {
    const control = document.activeElement;
    if (!control || control === document.body) return undefined;
    window.stops ??= [];
    let stop = window.stops.indexOf(control);
    if (stop < 0) stop = window.stops.push(control) - 1;
    const own = control.getBoundingClientRect();
    const points = [
      [0.5, 0.5],
      [0.2, 0.2],
      [0.8, 0.2],
      [0.2, 0.8],
      [0.8, 0.8]
    ].map(([across, down]) => [
      Math.min(innerWidth - 1, Math.max(0, own.x + own.width * across!)),
      Math.min(innerHeight - 1, Math.max(0, own.y + own.height * down!))
    ]);
    const covered = !points.some(([x, y]) => {
      const hit = document.elementFromPoint(x!, y!);
      return hit !== null && (control.contains(hit) || hit.contains(control));
    });
    const name =
      control.getAttribute("aria-label") ||
      (control.textContent ?? "").trim().replaceAll(/\s+/g, " ").slice(0, 40) ||
      control.getAttribute("title") ||
      control.tagName.toLowerCase();
    return { stop, name, covered };
  });

type Part = "control" | "owner";

const boxInView = (page: Page, part: Part) =>
  page.evaluate(
    ([part, reach]) => {
      const ringed = part === "owner" ? window.ringed.parentElement! : window.ringed;
      const box = () => ringed.getBoundingClientRect();
      const { top, bottom } = box();
      if (top < reach || bottom > innerHeight - reach) {
        ringed.scrollIntoView({ block: "center", behavior: "instant" });
      }
      const { x, y, width, height } = box();
      const corner = Math.min(
        Number.parseFloat(getComputedStyle(ringed).borderTopLeftRadius) || 0,
        width / 2,
        height / 2
      );
      return { box: { x, y, width, height }, corner };
    },
    [part, RING_REACH] as const
  );

const ownerLook = (page: Page) =>
  page.evaluate(() => {
    const style = getComputedStyle(window.ringed.parentElement!);
    return `${style.outline} ${style.boxShadow}`;
  });

const unfocus = (page: Page) => page.evaluate(() => (document.activeElement as HTMLElement).blur());

const refocus = (page: Page) =>
  page.evaluate(() => window.ringed.focus({ focusVisible: true } as FocusOptions));

async function changedPixels(page: Page, ringed: Box) {
  const box = padded(ringed, RING_REACH, page);
  const shown = await shoot(page, box);
  await unfocus(page);
  const hidden = await shoot(page, box);
  await refocus(page);
  let changed = 0;
  for (let y = box.y; y < box.y + box.height; y++) {
    for (let x = box.x; x < box.x + box.width; x++) {
      if (wcagContrast(shown.at(x, y), hidden.at(x, y)) >= FOCUS_CONTRAST) changed++;
    }
  }
  return changed;
}

/**
 * WCAG 2.4.13 Focus Appearance (AAA), which assumes no ring style: the area that changes by 3:1
 * between the focused and the unfocused control must be at least that of a band 2 px thick around
 * its perimeter. It counts changed pixels anywhere in the control, so a fill passes as a ring does.
 * https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance
 */
export async function ringStrength(page: Page) {
  await page.evaluate(() => (window.ringed = document.activeElement as HTMLElement));
  const focusedLook = await ownerLook(page);
  await unfocus(page);
  const ownsRing = (await ownerLook(page)) !== focusedLook;
  await refocus(page);
  const { box, corner } = await boxInView(page, ownsRing ? "owner" : "control");
  const changed = await changedPixels(page, box);
  const perimeter = 2 * (box.width + box.height) - (8 - 2 * Math.PI) * corner;
  return { changed, needed: Math.round(RING_THICKNESS * perimeter) };
}

export async function focusFindings(page: Page) {
  await page.evaluate(() => {
    window.stops = [];
    (document.activeElement as HTMLElement | null)?.blur();
  });
  const names: string[] = [];
  const findings: string[] = [];
  for (let press = 0; press < MAX_STOPS; press++) {
    await page.keyboard.press("Tab");
    const control = await focused(page);
    if (!control) continue;
    const reachedBefore = control.stop < names.length;
    if (!reachedBefore) {
      names.push(control.name);
      if (control.covered) findings.push(`${control.name} is covered`);
      const { changed, needed } = await ringStrength(page);
      if (changed < needed) findings.push(`${control.name}: ${changed} of ${needed} ring pixels`);
      continue;
    }
    const stillOnTheLastStop = control.stop === names.length - 1;
    if (stillOnTheLastStop) continue;
    const backAtTheStart = control.stop === 0;
    if (!backAtTheStart)
      findings.push(`after ${names.at(-1)} the keyboard goes back to ${control.name}`);
    return { names, findings };
  }
  throw new Error(
    `the keyboard never came back round after ${MAX_STOPS} stops: ${names.join(", ")}`
  );
}
