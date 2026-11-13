/**
 * The checks `audit` runs inside the page. Playwright sends each one to the browser as source
 * text, so none of them can use anything from this module; what they share, `installHelpers` puts
 * on `window` first.
 */

type Region = "header" | "main" | "footer";

interface PageHelpers {
  /** Which part of the site an element is in. */
  region: (element: Element) => Region;
  /** An element's text, shortened for a finding. */
  label: (element: Element) => string;
  /** The element holds text itself, not only through its children. */
  hasOwnText: (element: Element) => boolean;
  /** Whether the element hides what overflows it, horizontally and vertically. */
  clips: (element: Element) => [boolean, boolean];
  /** The boxes a text node's lines occupy. */
  textBoxes: (node: Node) => DOMRect[];
  /** The element or one of its ancestors has an opacity of zero. */
  transparent: (element: Element) => boolean;
  /** Each element's font size before a text setting changed, for `fixedText`. */
  fontSizes: Map<Element, number>;
}

declare global {
  interface Window {
    verify: PageHelpers;
  }
}

/** Run once per loaded page, before any check. */
export function installHelpers() {
  window.verify = {
    region: (element) =>
      element.closest("main") ? "main" : element.closest("footer") ? "footer" : "header",
    label: (element) => (element.textContent ?? "").trim().replaceAll(/\s+/g, " ").slice(0, 40),
    hasOwnText: (element) =>
      [...element.childNodes].some(
        (node) => node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim())
      ),
    clips: (element) => {
      const style = getComputedStyle(element);
      return [/hidden|clip/.test(style.overflowX), /hidden|clip/.test(style.overflowY)];
    },
    textBoxes: (node) => {
      const text = document.createRange();
      text.selectNodeContents(node);
      return [...text.getClientRects()];
    },
    transparent: (element) => {
      for (let at: Element | null = element; at; at = at.parentElement) {
        if (getComputedStyle(at).opacity === "0") return true;
      }
      return false;
    },
    fontSizes: new Map()
  };
}

/** A navigation link whose text runs over more than one line. */
function wrappedNavItems(): string[] {
  const wraps = (link: Element) => {
    const tops = new Set<number>();
    const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      for (const box of window.verify.textBoxes(walker.currentNode)) tops.add(Math.round(box.top));
    }
    return tops.size > 1;
  };
  const links = [...document.querySelectorAll("header nav > a")].filter(wraps);
  return [...new Set(links.map((link) => `nav item wraps: ${link.textContent.trim()}`))];
}

/** The navigation, laid out in the header rather than folded into the menu, on more than one row. */
function wrappedNav(): string[] {
  const nav = document.querySelector("header nav");
  if (!nav || getComputedStyle(nav).position !== "static") return [];
  const links = [...nav.querySelectorAll(":scope > a")].filter(
    (link) => link.getBoundingClientRect().width > 0
  );
  const rows = new Set(links.map((link) => Math.round(link.getBoundingClientRect().top)));
  return rows.size > 1 ? [`navigation runs over ${rows.size} rows`] : [];
}

/** A header control left far from the next one, instead of grouped with the others on the right. */
function strandedHeaderControls(): string[] {
  const controls = [...document.querySelectorAll("body > div > header > :is(button, a, div)")]
    .slice(1)
    .map((control) => control.getBoundingClientRect())
    .filter((box) => box.width > 2)
    .sort((one, other) => one.left - other.left);
  const gaps = controls.slice(1).map((next, index) => next.left - controls[index]!.right);
  return [
    ...new Set(
      gaps
        .filter((gap) => gap > 24)
        .map((gap) => `header control stranded ${Math.round(gap)}px from the next one`)
    )
  ];
}

/** A section title that runs under its button, or a subtitle cut short. */
function crowdedSectionHeaders(): string[] {
  const titleUnderButton = (tab: Element) => {
    const title = tab.querySelector("h2");
    const action = tab.querySelector("a");
    if (!title || !action) return [];
    const runsUnder = title.getBoundingClientRect().right > action.getBoundingClientRect().left - 2;
    return runsUnder ? [`section title runs under its button: ${title.textContent}`] : [];
  };
  const truncatedSubtitle = (tab: Element) => {
    const subtitle = tab.querySelector("h2 + span");
    return subtitle && subtitle.scrollWidth > subtitle.clientWidth + 1
      ? [`section subtitle truncated: ${subtitle.textContent}`]
      : [];
  };
  const tabs = [...document.querySelectorAll("section > header")];
  return [...new Set(tabs.flatMap((tab) => [...titleUnderButton(tab), ...truncatedSubtitle(tab)]))];
}

/** Visible text in the content or the footer that reaches past the right edge of the screen. */
function textOffScreen(): string[] {
  const width = document.documentElement.clientWidth;
  const visible = (element: Element) =>
    !element.closest(".sr-only") && getComputedStyle(element).visibility !== "hidden";
  const leaves = (element: Element) => {
    const box = element.getBoundingClientRect();
    return box.width > 2 && box.height > 2 && box.right > width + 1;
  };
  const elements = [...document.querySelectorAll("main *, footer *")].filter(
    (element) => window.verify.hasOwnText(element) && visible(element) && leaves(element)
  );
  return [
    ...new Set(
      elements.map(
        (element) => `text leaves the screen: ${element.textContent.trim().slice(0, 40)}`
      )
    )
  ];
}

/** Design checks for the default text size: wrapping, alignment and collisions. */
export const LAYOUT_CHECKS = [
  wrappedNavItems,
  wrappedNav,
  strandedHeaderControls,
  crowdedSectionHeaders,
  textOffScreen
];

/** The page scrolls sideways; the finding names the widest element no clipping box contains. */
function sidewaysScroll(): string[] {
  const root = document.documentElement;
  const width = root.clientWidth;
  if (root.scrollWidth <= width + 1) return [];
  const { region, label, clips } = window.verify;
  const fits = (element: Element) => element.getBoundingClientRect().right <= width + 1;
  const contained = (element: Element) => {
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      if (clips(parent).includes(true) && fits(parent)) return true;
    }
    return false;
  };
  const widest = [...document.querySelectorAll("body *")]
    .filter((element) => !fits(element) && !contained(element))
    .sort(
      (one, other) => other.getBoundingClientRect().right - one.getBoundingClientRect().right
    )[0];
  const from = widest
    ? `, ${region(widest)}: ${label(widest) || widest.tagName.toLowerCase()}`
    : "";
  return [`page scrolls sideways by ${root.scrollWidth - width}px${from}`];
}

/** Text cut off by a box with hidden overflow: a fixed height, `nowrap`, an ellipsis. */
// Its CRAP score assumes no coverage, but it runs in the browser, on every page `audit` loads.
// fallow-ignore-next-line complexity
function clippedText(): string[] {
  const { region, label, clips, textBoxes, transparent } = window.verify;

  /** Text meant to be read: not empty, hidden (as in a closed `<details>`), visually hidden on
   * purpose, or transparent. */
  const shown = (node: Node, parent: Element) =>
    Boolean(node.textContent?.trim()) &&
    // `data-truncated` marks a line cut short on purpose, whose whole text is a press away.
    !parent.closest(".sr-only, [data-truncated], script, style") &&
    parent.checkVisibility({ visibilityProperty: true }) &&
    !transparent(parent);

  const lineBoxes = (node: Node) =>
    textBoxes(node).filter((box) => box.width > 1 && box.height > 1);

  const beyond = (low: number, high: number, from: number, to: number) =>
    from < low - 2 || to > high + 2;

  // A box of a pixel or two is the visually hidden pattern, not a clipped label.
  const tiny = (element: Element) => element.clientWidth <= 2 || element.clientHeight <= 2;

  /** Some of `lines` falls outside the padding box of `element`, which hides overflow. */
  function cuts(element: Element, lines: DOMRect[]): boolean {
    const [clipsX, clipsY] = clips(element);
    if (!(clipsX || clipsY) || tiny(element)) return false;
    const box = element.getBoundingClientRect();
    const left = box.left + element.clientLeft;
    const top = box.top + element.clientTop;
    const [right, bottom] = [left + element.clientWidth, top + element.clientHeight];
    return lines.some(
      (line) =>
        (clipsX && beyond(left, right, line.left, line.right)) ||
        (clipsY && beyond(top, bottom, line.top, line.bottom))
    );
  }

  function clipped(parent: Element, lines: DOMRect[]): boolean {
    for (
      let element: Element | null = parent;
      element && element !== document.body;
      element = element.parentElement
    ) {
      if (cuts(element, lines)) return true;
    }
    return false;
  }

  const found = new Set<string>();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    if (parent && shown(node, parent) && clipped(parent, lineBoxes(node))) {
      found.add(`text clipped, ${region(parent)}: ${label(parent)}`);
    }
  }
  return [...found];
}

/**
 * A popover, as a teammate's profile is, that leaves the screen once open: what is past the edge
 * cannot be scrolled to. Each one whose button shows is opened as the button would, with it in
 * view, measured and closed again.
 */
function popoversOffScreen(): string[] {
  const { clientWidth: width, clientHeight: height } = document.documentElement;
  const outside = (box: DOMRect) =>
    box.left < -1 || box.top < -1 || box.right > width + 1 || box.bottom > height + 1;
  const leaves = (popover: HTMLElement) => {
    const button = document.querySelector(`[popovertarget="${popover.id}"]`);
    // Without a button on show, as the menu's above a phone's width, nobody can open it.
    if (!button?.checkVisibility({ visibilityProperty: true })) return false;
    button.scrollIntoView({ block: "center", behavior: "instant" });
    popover.showPopover();
    const box = popover.getBoundingClientRect();
    popover.hidePopover();
    return outside(box);
  };
  const popovers = [...document.querySelectorAll<HTMLElement>("[popover]")].filter(leaves);
  return [
    ...new Set(
      popovers.map((popover) => `popover leaves the screen: ${window.verify.label(popover)}`)
    )
  ];
}

/** Text a reader cannot see in full, under any text setting. */
export const OVERFLOW_CHECKS = [sidewaysScroll, clippedText, popoversOffScreen];

/** Remembers each element's font size, for `fixedText` to compare with after the setting changes. */
export function rememberFontSizes() {
  for (const element of document.querySelectorAll("body *")) {
    window.verify.fontSizes.set(element, Number.parseFloat(getComputedStyle(element).fontSize));
  }
}

/** Text under 24px that kept its size when the browser's font size doubled: a px font size. */
export function fixedText(): string[] {
  const { fontSizes, region, hasOwnText } = window.verify;
  // A size of zero is how a label is folded away, so it has nothing to scale.
  const small = (size: number) => size > 0 && size < 24;
  const readable = (element: Element) =>
    element.isConnected && hasOwnText(element) && !element.closest(".sr-only");
  const keptItsSize = (element: Element, before: number) => {
    const after = Number.parseFloat(getComputedStyle(element).fontSize);
    return after > 0 && after < before * 1.01;
  };
  const fixed = [...fontSizes].filter(
    ([element, before]) => small(before) && readable(element) && keptItsSize(element, before)
  );
  return [
    ...new Set(
      fixed.map(
        ([element]) =>
          `text ignores the font size setting, ${region(element)}: ${(element.textContent ?? "").trim().slice(0, 40)}`
      )
    )
  ];
}
