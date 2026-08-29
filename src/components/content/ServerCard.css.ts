import { keyframes, style, styleVariants, type StyleRule } from "@vanilla-extract/css";
import {
  colors,
  leading,
  media,
  motion,
  palette,
  radii,
  space,
  tracking,
  type,
  weight,
} from "#app/styles/theme.css";

const cardRule = {
  display: "grid",
  height: "100%",
  alignContent: "start",
  gap: space.three,
  padding: space.six,
  borderWidth: "2px",
  borderStyle: "solid",
  borderColor: colors.line,
  borderRadius: radii.twoXl,
  backgroundColor: colors.panel,
} satisfies StyleRule;

export const card = styleVariants({
  active: cardRule,
  offline: [cardRule, { borderColor: colors.lineSoft, backgroundColor: colors.panelSunk }],
});

export const heading = style({ display: "flex", alignItems: "center", gap: space.three });

const livePulse = keyframes({
  "0%, 62%, 100%": { opacity: 1 },
  "76%": { opacity: 0.35 },
});

const dotRule = {
  width: "0.625rem",
  height: "0.625rem",
  flexShrink: 0,
  borderWidth: "2px",
  borderStyle: "solid",
  borderColor: colors.line,
  borderRadius: radii.full,
  backgroundColor: palette.accent,
} satisfies StyleRule;

const liveDotRule = {
  animationName: livePulse,
  animationDuration: "2.4s",
  animationTimingFunction: motion.ease,
  animationIterationCount: "infinite",
} satisfies StyleRule;

export const dot = styleVariants({
  online: [dotRule, liveDotRule],
  polling: [dotRule, { backgroundColor: palette.signal }],
  offline: [dotRule, { backgroundColor: palette.danger }],
});

export const label = style({
  color: colors.ink,
  fontSize: type.base,
  lineHeight: leading.base,
  fontWeight: weight.bold,
  "@media": { [media.sm]: { fontSize: type.lg, lineHeight: leading.lg } },
});

export const status = style({ marginInlineStart: "auto" });

export const details = style({ display: "grid", alignContent: "start", gap: space.half });

export const detail = style({
  overflow: "hidden",
  color: colors.inkFaint,
  fontFamily: type.mono,
  fontSize: type.data,
  fontVariantNumeric: "tabular-nums",
  letterSpacing: tracking.tight,
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const copy = style({
  marginTop: "auto",
  paddingTop: space.three,
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: colors.lineSoft,
});

export const hostname = style({
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export type ServerCardState = keyof typeof card;
