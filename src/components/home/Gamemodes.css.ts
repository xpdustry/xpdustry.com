import { createVar, globalStyle, keyframes, style } from "@vanilla-extract/css";
import { media } from "#app/styles/media";
import { font, leading, tracking } from "#app/styles/scale";
import { figures } from "./shared";
import { vars } from "#app/styles/theme.css";

/** Where the header gives way to the text: under the header at first, across the top once narrow. */
const narrow = "(width < 660px)";
/** A phone. */
const phone = "(width < 440px)";
/** The narrowest phones: the longest name still on one line. */
const narrowest = "(width < 270px)";

/** The header's share of the row, which its colour fills. */
const bandWidth = createVar();
/** The header's height, once it lies across the top. */
const headHeight = createVar();
/** The mode's own colour. */
export const tint = createVar();

export const total = style({
  color: vars.ink,
});

export const modes = style({
  display: "grid",
  gap: 10,
});

/**
 * One mode to a row: its header names it, what it is follows, and a press anywhere copies its
 * address, spreading the mode's reticulate over the card from where it landed.
 */
export const mode = style({
  // at its narrowest, still room for the longest name beside the copy mark
  vars: { [bandWidth]: "clamp(342px, 32cqi, 372px)" },
  display: "grid",
  gridTemplateColumns: `${bandWidth} minmax(0, 1fr)`,
  alignItems: "center",
  cursor: "pointer",
  selectors: {
    // the card's own labyrinth, as under every card's text
    "&::before": {
      content: "",
      position: "absolute",
      inset: 0,
      zIndex: -2,
      background: 'url("../../assets/fade.webp") 0 -60px / 240px',
    },
  },
  "@container": {
    [narrow]: {
      vars: { [headHeight]: "68px" },
      gridTemplateColumns: "minmax(0, 1fr)",
    },
    [phone]: {
      vars: { [headHeight]: "64px" },
    },
  },
});

/** Toggled on a mode while its copy has landed, or failed. */
export const copied = style({});
export const failed = style({});

/**
 * The mode's colour under the header: it stops short of the header's end, where its patches
 * carry it on into a frayed edge.
 */
export const tinted = style({
  position: "absolute",
  inset: "0 auto 0 0",
  zIndex: -2,
  width: `calc(${bandWidth} - 34px)`,
  background: tint,
  "@container": {
    [narrow]: {
      inset: "0 0 auto",
      width: "auto",
      height: `calc(${headHeight} - 22px)`,
    },
  },
});

/** A line the patches are centred on. */
export const edge = style({
  position: "absolute",
  selectors: {
    // the patches grow under the pointer, as a linked card's do
    [`${mode}:is(:hover, :has(:focus-visible)) &`]: {
      vars: { "--grow": "1" },
    },
  },
});

/** Down the colour's side. */
export const side = style({
  inset: "0 auto 0 100%",
  width: 0,
  "@container": {
    [narrow]: { display: "none" },
  },
});

/** Along the colour's foot, once narrow. */
export const below = style({
  display: "none",
  "@container": {
    // the colour's foot, frayed: a fringe, drawn at three quarters its size
    [narrow]: {
      inset: "100% 0 auto",
      display: "block",
      height: 48,
      background: "0 0 / 486px 48px repeat-x",
      // the strip repeats without a seam: each row starts it somewhere else, so no two match
      selectors: {
        [`${mode}:nth-child(2) &`]: { backgroundPositionX: -190 },
        [`${mode}:nth-child(3) &`]: { backgroundPositionX: -75 },
        [`${mode}:nth-child(4) &`]: { backgroundPositionX: -330 },
        [`${mode}:nth-child(5) &`]: { backgroundPositionX: -255 },
      },
    },
  },
});

export const patches = style({
  overflow: "visible",
});

export const head = style({
  alignSelf: "stretch",
  display: "grid",
});

/** The header: its icon, its name and who is on it; the whole card answers to it. */
export const band = style({
  display: "grid",
  gridTemplateColumns: "104px minmax(0, 1fr) auto",
  alignItems: "center",
  minHeight: 92,
  padding: "0 16px 0 0",
  border: 0,
  background: "none",
  color: vars.ink,
  textAlign: "left",
  cursor: "inherit",
  selectors: {
    "&::after": {
      content: "",
      position: "absolute",
      inset: 0,
    },
    "&:focus-visible": {
      outline: "none",
    },
  },
  "@container": {
    [narrow]: {
      gridTemplateColumns: "84px minmax(0, 1fr) auto",
      height: headHeight,
      minHeight: 0,
    },
    [phone]: {
      gridTemplateColumns: "64px minmax(0, 1fr) auto",
      paddingRight: 14,
    },
    [narrowest]: {
      gridTemplateColumns: "50px minmax(0, 1fr) auto",
    },
  },
});

// the card shows the focus its header has
globalStyle(`${mode}:has(${band}:focus-visible)`, {
  outline: `3px solid ${vars.focus}`,
  outlineOffset: 3,
});

globalStyle(`${mode}:has(${band}:disabled)`, {
  cursor: "default",
});

const pop = keyframes({
  "0%": { scale: "0.9" },
  "45%": { scale: "1.12" },
  "100%": { scale: "1" },
});

/** The icon gives under the press and springs back as the copy lands. */
export const icon = style({
  justifySelf: "center",
  width: 40,
  height: 40,
  filter: "drop-shadow(0 4px 0 rgb(0 0 0 / 0.14))",
  transition: `scale 0.18s ${vars.easeOut}`,
  selectors: {
    [`${mode}:active &`]: {
      scale: "0.9",
      transitionDuration: "0.06s",
    },
    [`${copied} &`]: {
      animation: `${pop} 0.5s ${vars.easeOut}`,
    },
  },
  "@container": {
    [narrow]: { width: 34, height: 34 },
    [phone]: { width: 30, height: 30 },
  },
});

export const id = style({
  display: "grid",
  gap: 7,
  minWidth: 0,
  padding: "12px 0",
  "@container": {
    [narrow]: { gap: 6, padding: 0 },
  },
});

export const name = style({
  fontSize: font.h3,
  lineHeight: leading.heading,
  letterSpacing: tracking.title,
  whiteSpace: "nowrap",
  "@container": {
    [phone]: { fontSize: font.h4 },
    [narrowest]: { fontSize: font.text },
  },
});

/** The count and what replaces it share one line: one leaves upward as the other rises in. */
export const line = style({
  display: "grid",
  overflow: "hidden",
  margin: "-3px 0",
  padding: "3px 0",
});

globalStyle(`${line} > *`, {
  gridArea: "1 / 1",
  transition: `translate 0.32s ${vars.easeOut}, opacity 0.2s`,
});

export const count = style({
  justifySelf: "start",
  paddingLeft: 3,
  font: figures(),
  letterSpacing: 0,
});

/** Nobody on: the light is out and the line is quiet, as in the game's own list. */
export const empty = style({
  selectors: {
    [`${count}&`]: {
      color: vars.muted,
    },
    [`${count}&::before`]: {
      background: "none",
      boxShadow: `inset 0 0 0 2px ${vars.n10}`,
    },
  },
});

export const said = style({
  overflow: "hidden",
  // as tall as the count's line, which it takes the place of
  fontSize: font.caption,
  lineHeight: leading.tight,
  whiteSpace: "nowrap",
  translate: "0 110%",
  opacity: 0,
  selectors: {
    // the address itself, when it could not be copied: all of it, on a second line if it must
    [`${failed} &`]: {
      font: figures(1.25),
      letterSpacing: 0,
      whiteSpace: "normal",
      overflowWrap: "anywhere",
    },
  },
  "@media": {
    [media.still]: { translate: "none" },
  },
});

globalStyle(`:is(${copied}, ${failed}) ${count}`, {
  translate: "0 -110%",
  opacity: 0,
  "@media": {
    [media.still]: { translate: "none" },
  },
});

globalStyle(`:is(${copied}, ${failed}) ${said}`, {
  translate: "0",
  opacity: 1,
});

/** The copy mark turns into a tick in place. */
export const mark = style({
  display: "grid",
  marginLeft: 10,
});

globalStyle(`${mark} svg`, {
  gridArea: "1 / 1",
  width: 18,
  height: 18,
  transition: `scale 0.28s ${vars.easeOut}, rotate 0.28s ${vars.easeOut}, opacity 0.16s`,
});

export const glyph = style({
  opacity: 0.75,
  selectors: {
    [`${mode}:hover &`]: {
      opacity: 1,
    },
    // over the hover's own say on the mark
    [`${mode}${copied} &`]: {
      scale: "0.4",
      opacity: 0,
    },
  },
  "@media": {
    [media.still]: {
      selectors: {
        [`${mode}${copied} &`]: { scale: "1", rotate: "none" },
      },
    },
  },
});

export const tick = style({
  scale: "0.4",
  rotate: "-30deg",
  opacity: 0,
  selectors: {
    [`${copied} &`]: {
      scale: "1",
      rotate: "0deg",
      opacity: 1,
      transitionTimingFunction: vars.easeSpring,
    },
  },
  "@media": {
    [media.still]: { scale: "1", rotate: "none" },
  },
});

export const about = style({
  // about 50 characters to a line, however wide the row; clear of the colour's frayed edge
  maxWidth: "calc(40ch + 60px)",
  padding: "14px 22px 14px 38px",
  fontSize: font.small,
  lineHeight: leading.snug,
  color: vars.muted,
  textWrap: "balance",
  "@container": {
    [narrow]: { padding: "22px 18px 14px 20px" },
    [phone]: { padding: "22px 16px 14px" },
  },
});
