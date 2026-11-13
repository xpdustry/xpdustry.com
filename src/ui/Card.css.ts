import { globalStyle, keyframes, style } from "@vanilla-extract/css";
import { media } from "./styles/media";
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
    "&:focus-visible": { outline: `3px solid ${vars.focus}`, outlineOffset: -5 }
  }
});

/** A square around an icon that says what a press does, and then how it went. */
export const chip = style({
  display: "grid",
  placeItems: "center",
  width: 34,
  height: 34,
  borderRadius: radius.md,
  pointerEvents: "none"
});

globalStyle(`${chip} svg`, {
  width: 18,
  height: 18
});

/** The chip in a clickable card's corner: leave, or copy. */
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

/** A chip, or an icon, bouncing as a copy lands. */
export const pop = keyframes({
  "0%": { scale: "0.9" },
  "45%": { scale: "1.12" },
  "100%": { scale: "1" }
});

const shake = keyframes({
  "0%, 100%": { translate: "0" },
  "20%, 60%": { translate: "-3px" },
  "40%, 80%": { translate: "3px" }
});

/** A chip after the browser refused the copy. */
export const failed = style({
  selectors: {
    [`${chip}&`]: {
      background: vars.alarm,
      color: vars.onAlarm,
      "@media": { [media.motion]: { animation: `${shake} 0.4s ${vars.easeOut}` } }
    }
  }
});

/**
 * A copy chip's two icons, laid over each other: the copy glyph, which turns into the tick once
 * the copy landed (`ticked`). The chip keeps its own colours.
 */
export const swap = style({});
export const ticked = style({});

globalStyle(`${swap} svg`, {
  gridArea: "1 / 1",
  transition: `scale 0.28s ${vars.easeOut}, rotate 0.28s ${vars.easeOut}, opacity 0.16s`
});

export const glyph = style({
  selectors: {
    [`${ticked} &`]: { scale: "0.4", opacity: 0 }
  },
  "@media": {
    [media.still]: {
      selectors: {
        [`${ticked} &`]: { scale: "1", rotate: "none" }
      }
    }
  }
});

export const tick = style({
  scale: "0.4",
  rotate: "-30deg",
  opacity: 0,
  selectors: {
    [`${ticked} &`]: {
      scale: "1",
      rotate: "0deg",
      opacity: 1,
      transitionTimingFunction: vars.easeSpring
    }
  },
  "@media": {
    [media.still]: { scale: "1", rotate: "none" }
  }
});
