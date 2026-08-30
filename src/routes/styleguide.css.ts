import { keyframes, style } from "@vanilla-extract/css";
import { layoutStyles } from "#app/styles/layout.css";
import {
  colors,
  leading,
  media,
  palette,
  radii,
  space,
  tracking,
  type,
  weight,
} from "#app/styles/theme.css";

const pulse = keyframes({
  "0%, 100%": { opacity: 0.35, transform: "translateY(0)" },
  "50%": { opacity: 1, transform: "translateY(-0.25rem)" },
});

const ping = keyframes({
  "0%, 100%": { boxShadow: `0 0 0 0 ${palette.accent}` },
  "50%": { boxShadow: "0 0 0 0.375rem transparent" },
});

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
export const note = style([layoutStyles.prose, { color: colors.inkMuted, fontSize: type.sm }]);

export const themePanel = style({
  minWidth: 0,
  padding: space.eight,
  borderWidth: "2px",
  borderStyle: "solid",
  borderColor: colors.line,
  borderRadius: radii.twoXl,
  backgroundColor: colors.page,
  color: colors.ink,
});

export const fixtures = style({ display: "grid", minWidth: 0, gap: space.twelve });

export const group = style({ display: "grid", minWidth: 0, gap: space.three });

export const groupTitle = style({
  paddingBlockEnd: space.two,
  borderBlockEndWidth: "1px",
  borderBlockEndStyle: "solid",
  borderBlockEndColor: colors.lineSoft,
  color: colors.inkFaint,
  fontFamily: type.mono,
  fontSize: type.data,
  letterSpacing: tracking.wider,
  textTransform: "uppercase",
  fontVariantNumeric: "tabular-nums",
});

export const groupLayouts = {
  row: style({
    display: "flex",
    minWidth: 0,
    flexWrap: "wrap",
    alignItems: "center",
    gap: space.four,
  }),
  stack: style({ display: "grid", minWidth: 0, gap: space.six }),
} as const;

export const cardBadge = style({ alignSelf: "start" });

const statusDot = style({
  width: "0.625rem",
  height: "0.625rem",
  flexShrink: 0,
  borderWidth: "2px",
  borderStyle: "solid",
  borderColor: colors.line,
  borderRadius: radii.full,
});

export const statusDots = {
  live: style([
    statusDot,
    { backgroundColor: palette.accent, animation: `${ping} 1.6s ease-out infinite` },
  ]),
  signal: style([statusDot, { backgroundColor: palette.signal }]),
  danger: style([statusDot, { backgroundColor: palette.danger }]),
} as const;

export const loader = style({ display: "inline-flex", gap: space.three });

const loaderDot = style({
  width: space.two,
  height: space.two,
  borderRadius: radii.full,
  backgroundColor: colors.inkMuted,
  animation: `${pulse} 900ms ease-in-out infinite`,
});

export const loaderDots = [
  loaderDot,
  style([loaderDot, { animationDelay: "150ms" }]),
  style([loaderDot, { animationDelay: "300ms" }]),
] as const;

const state = style({
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

export const states = {
  default: state,
  centered: style([state, { justifyItems: "center", textAlign: "center" }]),
} as const;

export const stateTitle = style({ color: colors.ink, fontWeight: weight.bold });

export const projectGrid = style({
  display: "grid",
  gridAutoRows: "1fr",
  gap: space.six,
  gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
});

export const serverGrid = style({
  display: "grid",
  gap: space.four,
  margin: 0,
  padding: 0,
  listStyle: "none",
  gridTemplateColumns: "minmax(0, 1fr)",
  "@media": {
    [media.md]: { gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))" },
  },
});

export const proseFrame = style({
  maxWidth: "100%",
  minWidth: 0,
  overflow: "hidden",
});

export const tableFrame = style({
  maxWidth: "100%",
  minWidth: 0,
  overflowX: "auto",
  borderWidth: "2px",
  borderStyle: "solid",
  borderColor: colors.line,
  borderRadius: radii.twoXl,
  backgroundColor: colors.panel,
});

export const codeFigure = style({
  maxWidth: "100%",
  minWidth: 0,
  overflow: "hidden",
  borderWidth: "2px",
  borderStyle: "solid",
  borderColor: colors.line,
  borderRadius: radii.twoXl,
  backgroundColor: colors.panelSunk,
});

export const codeCaption = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: space.four,
  padding: `${space.two} ${space.two} ${space.two} ${space.four}`,
  borderBlockEndWidth: "1px",
  borderBlockEndStyle: "solid",
  borderBlockEndColor: colors.lineSoft,
  backgroundColor: colors.pageSunk,
});

export const codeLabel = style({
  color: colors.inkFaint,
  fontFamily: type.mono,
  fontSize: type.data,
  letterSpacing: tracking.tight,
});

export const codeBlock = style({
  margin: 0,
  padding: `${space.four} ${space.six}`,
  overflowX: "auto",
  color: colors.ink,
  fontFamily: type.mono,
  fontSize: type.data,
  letterSpacing: tracking.tight,
  lineHeight: leading.relaxed,
  tabSize: 2,
});

export const cardLink = style({
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
  gap: space.three,
  padding: space.six,
  textAlign: "left",
});

export const cardTitle = style({
  color: colors.ink,
  fontSize: type.xl,
  fontWeight: weight.bold,
  lineHeight: leading.tight,
  "@media": { [media.sm]: { fontSize: type.twoXl } },
});

export const cardMeta = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: space.three,
  marginBlockStart: "auto",
  paddingBlockStart: space.four,
  borderBlockStartWidth: "1px",
  borderBlockStartStyle: "solid",
  borderBlockStartColor: colors.lineSoft,
  color: colors.inkMuted,
  fontSize: type.sm,
});

export const cardAuthor = style({
  display: "inline-flex",
  minWidth: 0,
  alignItems: "center",
  gap: space.two,
  overflowWrap: "anywhere",
});

export const display = style({
  fontSize: type.fiveXl,
  fontWeight: weight.extraBold,
  fontStretch: "110%",
  letterSpacing: tracking.tight,
  "@media": { [media.sm]: { fontSize: "4.5rem" } },
});

export const headingTwo = style({
  fontSize: type.threeXl,
  fontWeight: weight.bold,
  fontStretch: "110%",
  letterSpacing: tracking.tight,
  "@media": { [media.sm]: { fontSize: type.fourXl } },
});

export const headingThree = style({
  fontSize: type.xl,
  fontWeight: weight.bold,
  "@media": { [media.sm]: { fontSize: type.twoXl } },
});

export const mono = style({
  color: colors.inkFaint,
  fontFamily: type.mono,
  fontSize: type.data,
  letterSpacing: tracking.tight,
  fontVariantNumeric: "tabular-nums",
});

export const navLink = style({
  display: "inline-flex",
  height: "2.125rem",
  alignItems: "center",
  paddingInline: space.three,
  borderRadius: radii.md,
  color: colors.inkMuted,
  fontSize: type.sm,
  fontWeight: weight.semibold,
  textDecoration: "none",
  selectors: { "&:hover": { backgroundColor: colors.panel, color: colors.ink } },
});

export const skipLink = style({
  padding: `${space.three} ${space.four}`,
  borderWidth: "2px",
  borderStyle: "solid",
  borderColor: colors.line,
  borderRadius: radii.lg,
  backgroundColor: colors.panel,
  fontWeight: weight.bold,
  textDecoration: "none",
});
