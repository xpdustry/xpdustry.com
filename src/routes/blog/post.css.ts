import { style } from "@vanilla-extract/css";
import { layoutStyles } from "#app/styles/layout.css";
import { colors, leading, radii, space, tracking, type, weight } from "#app/styles/theme.css";

export const page = style([
  layoutStyles.wrap,
  { paddingBlockStart: space.sixteen, paddingBlockEnd: space.twentyFour },
]);

export const article = style([layoutStyles.prose, { width: "100%", marginInline: "auto" }]);

export const title = style([layoutStyles.pageTitle, { textWrap: "balance" }]);

export const byline = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: space.three,
  marginBlock: space.eight,
  paddingBlock: space.four,
  borderBlockWidth: "1px",
  borderBlockStyle: "solid",
  borderBlockColor: colors.lineSoft,
  color: colors.inkMuted,
  fontSize: type.sm,
  lineHeight: leading.sm,
});

export const author = style({
  display: "inline-flex",
  minWidth: 0,
  alignItems: "center",
  gap: space.two,
  color: colors.ink,
  fontWeight: weight.bold,
  overflowWrap: "anywhere",
});

export const avatar = style({
  display: "block",
  width: space.six,
  height: space.six,
  flexShrink: 0,
  borderRadius: radii.full,
  objectFit: "cover",
});

export const separator = style({
  width: space.one,
  height: space.one,
  flexShrink: 0,
  borderRadius: radii.full,
  backgroundColor: colors.lineSoft,
});

export const prose = style({
  maxWidth: "100%",
  minWidth: 0,
});

export const releases = style({
  display: "grid",
  gap: space.three,
  marginBlockStart: space.twelve,
  padding: `${space.four} ${space.six}`,
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: colors.lineSoft,
  borderRadius: radii.lg,
  backgroundColor: colors.panel,
});

export const releaseIntro = style({
  color: colors.inkFaint,
  fontFamily: type.mono,
  fontSize: type.data,
  letterSpacing: tracking.tight,
});

export const release = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: space.three,
});

export const releaseName = style({
  color: colors.ink,
  fontWeight: weight.bold,
  overflowWrap: "anywhere",
});
