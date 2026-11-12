import { rem } from "./scale";

/**
 * Breakpoints are written in rem, which in a query means the browser's default font size, so a
 * reader who enlarges text gets the layout of a narrower screen instead of text that overflows.
 * At the default 16px they are the px widths they are written from.
 */
export const media = {
  small: upTo(430),
  phone: upTo(640),
  tablet: upTo(1100),
  motion: "(prefers-reduced-motion: no-preference)",
  still: "(prefers-reduced-motion: reduce)",
  coarse: "(pointer: coarse)",
} as const;

/** A component's own turning point, where its content stops fitting: up to `width` px wide. */
export function upTo(width: number) {
  return `(max-width: ${rem(width)})`;
}

/** A container query for a container narrower than `width` px, scaled like the breakpoints. */
export function narrowerThan(width: number) {
  return `(width < ${rem(width)})`;
}
