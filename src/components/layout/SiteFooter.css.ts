import { style } from "@vanilla-extract/css";
import logoMonochrome from "#app/assets/logo-monochrome.svg";
import { layoutStyles } from "#app/styles/layout.css";
import { colors, leading, media, space, tracking, type, weight } from "#app/styles/theme.css";

export const footer = style({
  position: "relative",
  borderTop: `2px solid ${colors.line}`,
  backgroundColor: colors.page,
  paddingBlock: space.sixteen,
});

export const footerLayout = style([
  layoutStyles.wrap,
  {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    gap: space.twelve,
    "@media": {
      [media.md]: { gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)" },
    },
  },
]);

export const identity = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: space.eight,
});

export const brand = style({
  display: "inline-flex",
  alignItems: "center",
  gap: space.three,
  color: colors.ink,
  textDecoration: "none",
});

export const logo = style({
  display: "block",
  width: "2.125rem",
  height: "2.125rem",
  flex: "none",
  backgroundColor: colors.ink,
  maskImage: `url("${logoMonochrome}")`,
  maskPosition: "center",
  maskRepeat: "no-repeat",
  maskSize: "contain",
});

export const brandName = style({
  fontSize: type.lg,
  fontWeight: weight.extraBold,
  fontStretch: "110%",
  letterSpacing: tracking.tight,
  lineHeight: leading.none,
});

export const copyright = style({
  display: "block",
  color: colors.inkFaint,
  fontSize: type.sm,
  lineHeight: leading.sm,
});

export const navigation = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(7.5rem, 1fr))",
  alignContent: "start",
  columnGap: space.eight,
  rowGap: space.six,
});

export const linkGroup = style({
  display: "grid",
  alignContent: "start",
  gap: space.two,
});

export const heading = style({
  marginBottom: space.one,
  color: colors.inkFaint,
  fontFamily: type.mono,
  fontSize: type.data,
  fontWeight: weight.medium,
  letterSpacing: tracking.wider,
  textTransform: "uppercase",
});

export const link = style({
  display: "inline-flex",
  minHeight: "1.625rem",
  alignItems: "center",
  color: colors.inkMuted,
  fontSize: type.sm,
  fontWeight: weight.semibold,
  lineHeight: leading.sm,
  textDecoration: "none",
  selectors: {
    "&:hover": {
      color: colors.ink,
      textDecoration: "underline",
      textUnderlineOffset: "3px",
    },
  },
});
