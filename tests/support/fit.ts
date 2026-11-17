import type { Page } from "playwright/test";

/**
 * The checks go to the page as source text, so a check can use nothing from this module, only
 * what `installHelpers` put on `window`.
 */
type Region = "header" | "main" | "footer";
type Overflows = readonly [horizontally: boolean, vertically: boolean];

interface FitHelpers {
  regionOf: (element: Element) => Region;
  shortText: (element: Element) => string;
  hasOwnText: (element: Element) => boolean;
  hidesOverflow: (element: Element) => Overflows;
  lineBoxes: (node: Node) => DOMRect[];
  transparent: (element: Element) => boolean;
  /** Each element's font size before a text setting changed, for `fixedText`. */
  fontSizes: Map<Element, number>;
}

declare global {
  interface Window {
    fit: FitHelpers;
  }
}

function installHelpers() {
  // Read once per measurement: nothing a check reads changes until the next setting or width.
  const overflows = new Map<Element, Overflows>();
  const transparency = new Map<Element, boolean>();
  window.fit = {
    fontSizes: window.fit?.fontSizes ?? new Map(),
    regionOf: (element) =>
      element.closest("main") ? "main" : element.closest("footer") ? "footer" : "header",
    shortText: (element) =>
      (element.textContent ?? "").trim().replaceAll(/\s+/g, " ").slice(0, 40) ||
      element.tagName.toLowerCase(),
    hasOwnText: (element) =>
      [...element.childNodes].some(
        (node) => node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim())
      ),
    hidesOverflow: (element) => {
      let hides = overflows.get(element);
      if (!hides) {
        const style = getComputedStyle(element);
        hides = [/hidden|clip/.test(style.overflowX), /hidden|clip/.test(style.overflowY)];
        overflows.set(element, hides);
      }
      return hides;
    },
    lineBoxes: (node) => {
      const text = document.createRange();
      text.selectNodeContents(node);
      return [...text.getClientRects()].filter((box) => box.width > 1 && box.height > 1);
    },
    transparent: (element) => {
      let known = transparency.get(element);
      if (known === undefined) {
        known =
          getComputedStyle(element).opacity === "0" ||
          (element.parentElement !== null && window.fit.transparent(element.parentElement));
        transparency.set(element, known);
      }
      return known;
    }
  };
}

const unique = (findings: string[]) => [...new Set(findings)];

function navOverSeveralRows(): string[] {
  const nav = document.querySelector("header nav");
  const foldedIntoMenu = !nav || getComputedStyle(nav).position !== "static";
  if (foldedIntoMenu) return [];
  const rows = new Set(
    [...nav.querySelectorAll(":scope > a")]
      .map((link) => link.getBoundingClientRect())
      .filter((box) => box.width > 0)
      .map((box) => Math.round(box.top))
  );
  return rows.size > 1 ? [`navigation runs over ${rows.size} rows`] : [];
}

function headerOverSeveralRows(): string[] {
  const header = document.querySelector(".wrap > header");
  if (!header) return [];
  const boxes = [...header.children]
    .filter((control) => getComputedStyle(control).position !== "absolute")
    .map((control) => control.getBoundingClientRect())
    .filter((box) => box.width > 0);
  const firstRowEnds = Math.min(...boxes.map((box) => box.bottom));
  const wrapped = boxes.some((box) => box.top >= firstRowEnds);
  return wrapped ? ["header runs over several rows"] : [];
}

function crowdedSectionHeaders(): string[] {
  return [...document.querySelectorAll("section > header")].flatMap((header) => {
    const title = header.querySelector("h2");
    const action = header.querySelector("a");
    const subtitle = header.querySelector("h2 + span");
    const findings: string[] = [];
    if (title && action) {
      const runsUnder =
        title.getBoundingClientRect().right > action.getBoundingClientRect().left - 2;
      if (runsUnder) findings.push(`section title runs under its button: ${title.textContent}`);
    }
    if (subtitle && subtitle.scrollWidth > subtitle.clientWidth + 1) {
      findings.push(`section subtitle truncated: ${subtitle.textContent}`);
    }
    return findings;
  });
}

/** A project card's description lines crossing its art: the art has a lane of its own. */
function artOverText(): string[] {
  const { lineBoxes, shortText } = window.fit;
  const crosses = (one: DOMRect, other: DOMRect) =>
    one.left < other.right - 1 &&
    other.left < one.right - 1 &&
    one.top < other.bottom - 1 &&
    other.top < one.bottom - 1;
  return [...document.querySelectorAll("#projects a")].flatMap((card) => {
    const art = card.querySelector(":scope > svg")?.getBoundingClientRect();
    if (!art || art.width === 0) return [];
    return [...card.querySelectorAll(":scope > p")]
      .filter((text) => lineBoxes(text).some((line) => crosses(line, art)))
      .map((text) => `project art covers its description: ${shortText(text)}`);
  });
}

const LAYOUT_CHECKS = [
  artOverText,
  navOverSeveralRows,
  headerOverSeveralRows,
  crowdedSectionHeaders
];

function sidewaysScroll(): string[] {
  const root = document.documentElement;
  const width = root.clientWidth;
  if (root.scrollWidth <= width + 1) return [];
  const leaves = (element: Element | null) =>
    Boolean(element) && element!.getBoundingClientRect().right > width + 1;
  // The outermost element past the edge, to start looking from.
  const culprit = [...document.querySelectorAll("body *")].find(
    (element) => leaves(element) && !leaves(element.parentElement)
  );
  const named = culprit
    ? `, ${window.fit.regionOf(culprit)}: ${window.fit.shortText(culprit)}`
    : "";
  return [`page scrolls sideways by ${root.scrollWidth - width}px${named}`];
}

function clippedText(): string[] {
  const { regionOf, shortText, hidesOverflow, lineBoxes, transparent } = window.fit;
  const SLACK = 2;
  const meantToBeRead = (node: Node, parent: Element) =>
    Boolean(node.textContent?.trim()) &&
    !parent.closest(".sr-only, [data-truncated], script, style") &&
    parent.checkVisibility({ visibilityProperty: true }) &&
    !transparent(parent);
  const visuallyHidden = (element: Element) =>
    element.clientWidth <= SLACK || element.clientHeight <= SLACK;
  const outside = (low: number, high: number, from: number, to: number) =>
    from < low - SLACK || to > high + SLACK;

  const cuts = (element: Element, lines: DOMRect[]) => {
    const [horizontally, vertically] = hidesOverflow(element);
    if (!(horizontally || vertically) || visuallyHidden(element)) return false;
    const box = element.getBoundingClientRect();
    const left = box.left + element.clientLeft;
    const top = box.top + element.clientTop;
    return lines.some(
      (line) =>
        (horizontally && outside(left, left + element.clientWidth, line.left, line.right)) ||
        (vertically && outside(top, top + element.clientHeight, line.top, line.bottom))
    );
  };
  const clipped = (parent: Element, lines: DOMRect[]) => {
    for (let at: Element | null = parent; at && at !== document.body; at = at.parentElement) {
      if (cuts(at, lines)) return true;
    }
    return false;
  };

  const findings: string[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    if (parent && meantToBeRead(node, parent) && clipped(parent, lineBoxes(node))) {
      findings.push(`text clipped, ${regionOf(parent)}: ${shortText(parent)}`);
    }
  }
  return findings;
}

function popoversOffScreen(): string[] {
  const { clientWidth: width, clientHeight: height } = document.documentElement;
  const outside = (box: DOMRect) =>
    box.left < -1 || box.top < -1 || box.right > width + 1 || box.bottom > height + 1;
  const leaves = (popover: HTMLElement) => {
    const button = document.querySelector(`[popovertarget="${popover.id}"]`);
    if (!button?.checkVisibility({ visibilityProperty: true })) return false;
    button.scrollIntoView({ block: "center", behavior: "instant" });
    popover.showPopover();
    const box = popover.getBoundingClientRect();
    popover.hidePopover();
    return outside(box);
  };
  return [...document.querySelectorAll<HTMLElement>("[popover]")]
    .filter(leaves)
    .map((popover) => `popover leaves the screen: ${window.fit.shortText(popover)}`);
}

const OVERFLOW_CHECKS = [sidewaysScroll, clippedText, popoversOffScreen];

function rememberFontSizes(): string[] {
  window.fit.fontSizes = new Map();
  for (const element of document.querySelectorAll("body *")) {
    window.fit.fontSizes.set(element, Number.parseFloat(getComputedStyle(element).fontSize));
  }
  return [];
}

/** Text under 24px that kept its size when the browser's font size doubled: a px font size. */
function fixedText(): string[] {
  const { fontSizes, regionOf, shortText, hasOwnText } = window.fit;
  // A size of zero is how a label is folded away, so it has nothing to scale.
  const small = (size: number) => size > 0 && size < 24;
  const readable = (element: Element) =>
    element.isConnected && hasOwnText(element) && !element.closest(".sr-only, script, style");
  const keptItsSize = (element: Element, before: number) => {
    const after = Number.parseFloat(getComputedStyle(element).fontSize);
    return after > 0 && after < before * 1.01;
  };
  return [...fontSizes]
    .filter(
      ([element, before]) => small(before) && readable(element) && keptItsSize(element, before)
    )
    .map(
      ([element]) =>
        `text ignores the browser's font size, ${regionOf(element)}: ${shortText(element)}`
    );
}

/** One round trip for every check: their source, after the helpers they share. */
async function findings(page: Page, checks: readonly (() => string[])[]): Promise<string[]> {
  const run = `(${String(installHelpers)})(); [${checks.map(String).join(", ")}].flatMap((check) => check())`;
  return unique(await page.evaluate<string[]>(run));
}

export const overflowFindings = (page: Page) => findings(page, OVERFLOW_CHECKS);
/** Before the browser's font size changes: what `fontGrowthFindings` compares with. */
export const rememberFontSizesOn = (page: Page) => findings(page, [rememberFontSizes]);
/** Overflow, and text that did not grow with the browser's font size since it was remembered. */
export const fontGrowthFindings = (page: Page) => findings(page, [...OVERFLOW_CHECKS, fixedText]);
export const layoutFindings = (page: Page) =>
  findings(page, [...LAYOUT_CHECKS, ...OVERFLOW_CHECKS]);
