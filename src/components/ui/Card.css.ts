import { globalStyle, style } from "@vanilla-extract/css";
import { radius } from "#app/styles/scale";
import { vars } from "#app/styles/theme.css";

export const card = style({});

globalStyle(`:where(${card})`, {
  position: "relative",
  isolation: "isolate",
  overflow: "hidden",
  border: `2px solid ${vars.outline}`,
  borderRadius: vars.r,
  background: vars.tile,
  color: "inherit",
  textDecoration: "none",
});

/** A button laid over a card, so a press anywhere on the card is a press on it. */
export const cover = style({
  position: "absolute",
  inset: 0,
  zIndex: 1,
  border: 0,
  borderRadius: "inherit",
  background: "none",
  cursor: "pointer",
  selectors: {
    "&:focus-visible": { outline: `3px solid ${vars.focus}`, outlineOffset: -5 },
  },
});

/** The icon in a clickable card's corner that says what a press does: leave, or copy. */
export const hint = style({
  position: "absolute",
  top: 16,
  right: 16,
  display: "grid",
  placeItems: "center",
  width: 34,
  height: 34,
  borderRadius: radius.md,
  background: "color-mix(in srgb, currentColor 14%, transparent)",
  pointerEvents: "none",
  transition: `transform 0.25s ${vars.easeSpring}`,
});

globalStyle(`${hint} svg`, {
  width: 18,
  height: 18,
});
