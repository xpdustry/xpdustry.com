/**
 * The scales every component's type and corners are picked from, in px. A size that is not here
 * is derived from its surroundings (a nested corner, a fluid `clamp()`), and says so where it is.
 */

/** Font sizes. The body's own is `text`. */
export const font = {
  /** Counts, dates and other small print. */
  caption: 13,
  /** Secondary text: a card's blurb, a label, a chip. */
  small: 14.5,
  text: 17,
  /** A page's opening paragraph. */
  lead: 18,
  /** A small card's title. */
  h4: 21,
  /** A card's or a tray's title. */
  h3: 26,
  h2: 32,
  h1: 40,
  /** A cover's headline. */
  display: 56,
  /** The home page's and the blog's name. */
  hero: 84,
} as const;

export const leading = {
  /** Headlines of a line or two. */
  tight: 1,
  heading: 1.1,
  /** Short text on cards. */
  snug: 1.45,
  /** Running text; the body's own. */
  text: 1.55,
} as const;

export const tracking = {
  /** `display` and `hero` sizes. */
  display: "-0.03em",
  heading: "-0.02em",
  title: "-0.01em",
} as const;

/** Corner radii; a card's own is `vars.r`. */
export const radius = {
  /** The focus ring, inline code. */
  xs: 4,
  /** Chips, thumbnails, small controls. */
  sm: 8,
  md: 12,
  /** A panel inside a card. */
  lg: 18,
  pill: 999,
} as const;
