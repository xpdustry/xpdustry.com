import { globalStyle, style } from "@vanilla-extract/css";
import { radius } from "./styles/scale";
import { vars } from "./styles/theme.css";

export const card = style({});

globalStyle(`:where(${card})`, {
  position: "relative",
  isolation: "isolate",
  overflow: "hidden",
  border: `2px solid ${vars.outline}`,
  borderRadius: vars.r,
  background: vars.tile,
  color: "inherit",
  textDecoration: "none"
});

const COVER_LAYER = 1;
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
    "&:focus-visible": { outline: `3px solid ${vars.focus}`, outlineOffset: -5 }
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
  zIndex: COVER_LAYER + 1,
  userSelect: "all",
  cursor: "text"
} as const;

export const hint = style([
  chip,
  {
    position: "absolute",
    top: 16,
    right: 16,
    background: "color-mix(in srgb, currentColor 14%, transparent)",
    transition: `transform 0.25s ${vars.easeSpring}`
  }
]);
