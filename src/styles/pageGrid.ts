import { style, type StyleRule } from "@vanilla-extract/css";
import { media } from "./media";
import { vars } from "./theme.css";

export const PAGE_GRID = {
  display: "grid",
  gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
  gap: vars.gap,
  "@media": {
    [media.tablet]: { gridTemplateColumns: "repeat(6, minmax(0, 1fr))" },
  },
} satisfies StyleRule;

/**
 * The page grid and `changes` to it as a single class, so the changes win in any stylesheet
 * order. For a `.css.ts` file to call.
 */
export function pageGridWith({ "@media": queries, ...changes }: StyleRule): string {
  return style({
    ...PAGE_GRID,
    ...changes,
    "@media": { ...PAGE_GRID["@media"], ...queries },
  });
}
