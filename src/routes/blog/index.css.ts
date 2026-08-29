import { style } from "@vanilla-extract/css";
import { layoutStyles } from "#app/styles/layout.css";
import { colors, radii, space, weight } from "#app/styles/theme.css";

export const page = style([
  layoutStyles.wrap,
  { paddingBlockStart: space.twelve, paddingBlockEnd: space.twentyFour },
]);

export const header = style([layoutStyles.prose, { marginBlockEnd: space.sixteen }]);
export const pageTitle = layoutStyles.pageTitle;
export const lede = style([
  layoutStyles.lede,
  { marginBlockStart: space.four, color: colors.inkMuted },
]);

export const posts = style({
  display: "grid",
  gridAutoRows: "1fr",
  gap: space.six,
  gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
});

export const article = style({ display: "grid", minWidth: 0 });

export const empty = style({
  display: "grid",
  justifyItems: "start",
  gap: space.three,
  padding: `${space.eight} ${space.six}`,
  borderWidth: "1px",
  borderStyle: "dashed",
  borderColor: colors.lineSoft,
  borderRadius: radii.twoXl,
  backgroundColor: colors.panelSunk,
  color: colors.inkMuted,
});

export const emptyTitle = style({ color: colors.ink, fontWeight: weight.bold });
