export const media = {
  small: "(max-width: 430px)",
  phone: "(max-width: 640px)",
  tablet: "(max-width: 1100px)",
  motion: "(prefers-reduced-motion: no-preference)",
  still: "(prefers-reduced-motion: reduce)",
  coarse: "(pointer: coarse)",
} as const;

/** A component's own turning point, where its content stops fitting: up to `width` px wide. */
export const upTo = (width: number) => `(max-width: ${width}px)`;
