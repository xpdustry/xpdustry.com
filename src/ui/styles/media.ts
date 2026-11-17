import { rem } from "./scale";

export const media = {
  small: upTo(430),
  phone: upTo(640),
  tablet: upTo(1100),
  motion: "(prefers-reduced-motion: no-preference)",
  still: "(prefers-reduced-motion: reduce)",
  coarse: "(pointer: coarse)",
  fine: "(pointer: fine)"
} as const;

export function upTo(px: number) {
  return `(max-width: ${rem(px)})`;
}

export function narrowerThan(px: number) {
  return `(width < ${rem(px)})`;
}
