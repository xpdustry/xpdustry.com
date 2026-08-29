import { globalStyle, style } from "@vanilla-extract/css";
import { layoutStyles } from "#app/styles/layout.css";
import {
  colors,
  layout,
  leading,
  media,
  radii,
  space,
  tracking,
  type,
  weight,
} from "#app/styles/theme.css";

globalStyle("html:has(#projects:target, #servers:target)", {
  scrollBehavior: "smooth",
  "@media": {
    "(prefers-reduced-motion: reduce)": { scrollBehavior: "auto" },
  },
});

export const content = style({
  position: "relative",
  isolation: "isolate",
  paddingBlockStart: space.eight,
  paddingBlockEnd: space.twelve,
  "@media": { [media.sm]: { paddingBlockEnd: space.sixteen } },
});

export const sections = style([layoutStyles.wrap, { display: "grid", gap: space.twelve }]);

export const hero = style({
  paddingBlockStart: space.twelve,
  paddingBlockEnd: space.eight,
  "@media": { [media.sm]: { paddingBlockStart: space.sixteen } },
});

export const heroInner = style([
  layoutStyles.wrap,
  {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: space.eight,
    "@media": {
      [media.sm]: { gap: space.ten },
      [media.lg]: { flexDirection: "row", columnGap: space.twelve },
    },
  },
]);

export const hiddenHeading = layoutStyles.screenReaderOnly;

export const logoFrame = style({
  display: "flex",
  flexShrink: 0,
  justifyContent: "center",
  width: "auto",
  "@media": { [media.lg]: { width: "25%" } },
});

export const logo = style({
  width: "7rem",
  height: "auto",
  "@media": { [media.sm]: { width: "10rem" } },
});

export const pitch = style({
  minWidth: 0,
  "@media": { [media.lg]: { flex: 1 } },
});

export const positioning = style({
  color: colors.inkMuted,
  fontSize: type.xl,
  fontWeight: weight.bold,
  lineHeight: leading.xl,
  textAlign: "center",
  "@media": {
    [media.sm]: { fontSize: type.twoXl, lineHeight: leading.twoXl },
    [media.lg]: { textAlign: "start" },
  },
});

export const introduction = style({
  maxWidth: layout.measure,
  marginBlockStart: space.five,
  color: colors.inkMuted,
  fontSize: type.base,
  lineHeight: leading.base,
});

export const actions = style({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: space.three,
  marginBlockStart: space.eight,
  "@media": { [media.lg]: { justifyContent: "flex-start" } },
});

export const cardList = style({
  display: "grid",
  gridAutoRows: "1fr",
  gap: space.three,
  gridTemplateColumns: "minmax(0, 1fr)",
  "@media": {
    [media.sm]: { gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))" },
  },
});

export const serverList = style({
  display: "grid",
  gap: space.three,
  margin: 0,
  padding: 0,
  listStyle: "none",
  gridTemplateColumns: "minmax(0, 1fr)",
  "@media": {
    [media.sm]: { gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))" },
  },
});

export const outage = style({
  marginBlockStart: space.four,
  color: colors.inkMuted,
  fontSize: type.sm,
});

export const empty = style({
  display: "grid",
  justifyItems: "start",
  gap: space.three,
  padding: `${space.six} ${space.five}`,
  borderWidth: "1px",
  borderStyle: "dashed",
  borderColor: colors.lineSoft,
  borderRadius: radii.twoXl,
  backgroundColor: colors.panelSunk,
  color: colors.inkMuted,
});

export const emptyTitle = style({ color: colors.ink, fontWeight: weight.bold });

export const sectionHead = style({
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: space.three,
  marginBlockEnd: space.four,
  paddingBlockEnd: space.three,
  borderBlockEndWidth: "2px",
  borderBlockEndStyle: "solid",
  borderBlockEndColor: colors.line,
});

export const sectionTitle = style({
  fontSize: type.twoXl,
  fontWeight: weight.extraBold,
  fontStretch: "110%",
  letterSpacing: tracking.tight,
  lineHeight: leading.twoXl,
});

export const sectionLink = style({
  color: colors.inkFaint,
  fontFamily: type.mono,
  fontSize: type.data,
  fontWeight: weight.medium,
  letterSpacing: tracking.tight,
  textDecoration: "none",
  selectors: {
    "&:hover": {
      color: colors.ink,
      textDecoration: "underline",
      textUnderlineOffset: "3px",
    },
  },
});
