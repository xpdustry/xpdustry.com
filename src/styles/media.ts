/**
 * The page's media queries, for `@media` in styles and `matchMedia` in components, so both sides
 * always agree on where a layout turns.
 */
export const media = {
  /** One column. */
  phone: "(max-width: 640px)",
  /** The twelve-column grids fold to six. */
  tablet: "(max-width: 1100px)",
  motion: "(prefers-reduced-motion: no-preference)",
  still: "(prefers-reduced-motion: reduce)",
  /** No hover, a finger for a pointer. */
  coarse: "(pointer: coarse)",
} as const;

/** A component's own turning point, where its content stops fitting: up to `width` px wide. */
export const upTo = (width: number) => `(max-width: ${width}px)`;
