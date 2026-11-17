import { createVar, fallbackVar, globalStyle, style } from "@vanilla-extract/css";
import { ringInside } from "./styles/focus";
import { OUTLINE, radius } from "./styles/scale";
import { vars } from "./styles/theme.css";

export const card = style({});

export const face = createVar();
export const FACE_INSET = OUTLINE / 2;
export const FACE_BLEED = OUTLINE - FACE_INSET;

const FACE_LAYER = -3;
const COVER_LAYER = 1;
const ABOVE_COVER_LAYER = COVER_LAYER + 1;
const OUTLINE_LAYER = ABOVE_COVER_LAYER + 1;

globalStyle(`:where(${card})`, {
  position: "relative",
  isolation: "isolate",
  overflow: "hidden",
  borderRadius: vars.r,
  color: "inherit",
  textDecoration: "none"
});

globalStyle(`:where(${card})::before`, {
  content: '""',
  position: "absolute",
  inset: FACE_INSET,
  zIndex: FACE_LAYER,
  borderRadius: "inherit",
  background: fallbackVar(face, vars.tile),
  pointerEvents: "none"
});

globalStyle(`:where(${card})::after`, {
  content: '""',
  position: "absolute",
  inset: 0,
  zIndex: OUTLINE_LAYER,
  border: `${OUTLINE}px solid ${vars.outline}`,
  borderRadius: "inherit",
  pointerEvents: "none"
});

const CHIP_SIZE = 34;
const CHIP_ICON = 18;
export const CHIP_OVERHANG = (CHIP_SIZE - CHIP_ICON) / 2;

export const cover = style({
  position: "absolute",
  inset: 0,
  zIndex: COVER_LAYER,
  border: 0,
  borderRadius: "inherit",
  background: "none",
  cursor: "pointer",
  selectors: {
    "&:focus-visible": ringInside(OUTLINE)
  }
});

export const chip = style({
  display: "grid",
  placeItems: "center",
  width: CHIP_SIZE,
  height: CHIP_SIZE,
  borderRadius: radius.md,
  pointerEvents: "none"
});

globalStyle(`${chip} svg`, {
  width: CHIP_ICON,
  height: CHIP_ICON
});

export const selectableAboveCover = {
  position: "relative",
  zIndex: ABOVE_COVER_LAYER,
  userSelect: "all",
  cursor: "text"
} as const;

const HINT_INSET = 16;

export const hint = style([
  chip,
  {
    position: "absolute",
    top: HINT_INSET + OUTLINE,
    right: HINT_INSET + OUTLINE,
    background: "color-mix(in srgb, currentColor 14%, transparent)",
    transition: `transform 0.25s ${vars.easeSpring}`
  }
]);
