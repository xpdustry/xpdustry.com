import { style } from "@vanilla-extract/css";
import { media } from "./media";
import { vars } from "./theme.css";

/**
 * The grid a page's cards sit on: twelve columns, six from tablet width down. A page adds its own
 * row height, and its cards say how many columns they span.
 */
export const grid = style({
  display: "grid",
  gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
  gap: vars.gap,
  "@media": {
    [media.tablet]: { gridTemplateColumns: "repeat(6, minmax(0, 1fr))" },
  },
});
