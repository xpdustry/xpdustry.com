import { createVar, globalStyle, keyframes, style } from "@vanilla-extract/css";
import { paint } from "#app/textures/catalogue";
import { media, narrowerThan } from "#app/ui/styles/media";
import { DIMMED, font, leading, OUTLINE, rem, tracking } from "#app/ui/styles/scale";
import { figures } from "./sections";
import { faceFrom } from "#app/textures/enter.css";
import {
  CHIP_OVERHANG,
  face,
  FACE_BLEED,
  FACE_INSET,
  selectableAboveCover
} from "#app/ui/Card.css";
import { line } from "#app/ui/copy/Roll.css";
import { vars } from "#app/ui/styles/theme.css";

const narrow = narrowerThan(660);
const phone = narrowerThan(440);
const narrowest = narrowerThan(270);

const RIDGE_REACH = 90;
const FRINGE_HEIGHT = 48;

const bandWidth = createVar();
const headHeight = createVar();
export const tint = createVar();

export const total = style({
  verticalAlign: "top",
  color: vars.ink
});

export const modes = style({
  display: "grid",
  gap: 10
});

export const mode = style({
  vars: {
    [bandWidth]: `clamp(${rem(342)}, 32cqi, ${rem(372)})`,
    [face]: `${paint("fade")} ${FACE_BLEED}px ${FACE_BLEED - 60}px / 240px, ${vars.tile}`
  },
  display: "grid",
  gridTemplateColumns: `${bandWidth} minmax(0, 1fr)`,
  alignItems: "center",
  padding: OUTLINE,
  "@container": {
    [narrow]: {
      vars: { [headHeight]: "68px" },
      gridTemplateColumns: "minmax(0, 1fr)"
    },
    [phone]: {
      vars: { [headHeight]: "64px" }
    }
  }
});

const copyable = `${mode}:has(> button:enabled)`;
const uncopyable = `${mode}:has(> button:disabled)`;

export const copied = style({});
export const failed = style({});

export const tinted = style({
  vars: { [faceFrom]: `calc(-100% - ${RIDGE_REACH}px) 0` },
  position: "absolute",
  inset: `${FACE_INSET}px auto ${FACE_INSET}px ${FACE_INSET}px`,
  zIndex: -2,
  width: `calc(${bandWidth} + ${FACE_BLEED}px - 34px)`,
  borderRadius: "inherit",
  borderTopRightRadius: 0,
  borderBottomRightRadius: 0,
  background: tint,
  "@container": {
    [narrow]: {
      vars: { [faceFrom]: `0 calc(-100% - ${FACE_BLEED + FRINGE_HEIGHT}px)` },
      gridArea: "1 / 1 / 2 / 2",
      inset: `${-FACE_BLEED}px ${-FACE_BLEED}px 22px`,
      width: "auto",
      borderTopRightRadius: "inherit",
      borderBottomLeftRadius: 0
    }
  }
});

const grownEdge = { vars: { "--grow": "1" } };

export const edge = style({
  position: "absolute",
  selectors: {
    [`${mode}:has(:focus-visible) &`]: grownEdge
  },
  "@media": {
    [media.hover]: {
      selectors: { [`${copyable}:hover &`]: grownEdge }
    }
  }
});

export const side = style({
  inset: "0 auto 0 100%",
  width: 0,
  "@container": {
    [narrow]: { display: "none" }
  }
});

const fringeAt = (x: number) => `${x + FACE_BLEED}px 0`;

export const fringe = style({
  display: "none",
  "@container": {
    [narrow]: {
      inset: "100% 0 auto",
      display: "block",
      height: FRINGE_HEIGHT,
      background: tint,
      mask: `${paint("fringe")} ${fringeAt(0)} / 486px ${FRINGE_HEIGHT}px repeat-x`,
      selectors: {
        [`${mode}:nth-child(2) &`]: { maskPosition: fringeAt(-190) },
        [`${mode}:nth-child(3) &`]: { maskPosition: fringeAt(-75) },
        [`${mode}:nth-child(4) &`]: { maskPosition: fringeAt(-330) },
        [`${mode}:nth-child(5) &`]: { maskPosition: fringeAt(-255) }
      }
    }
  }
});

export const patches = style({
  overflow: "visible"
});

export const band = style({
  alignSelf: "stretch",
  display: "grid",
  gridTemplateColumns: "104px minmax(0, 1fr) auto",
  alignItems: "center",
  minHeight: 92,
  padding: "0 16px 0 0",
  "@container": {
    [narrow]: {
      gridTemplateColumns: "84px minmax(0, 1fr) auto",
      minHeight: headHeight
    },
    [phone]: {
      gridTemplateColumns: "64px minmax(0, 1fr) auto",
      paddingRight: 14
    },
    [narrowest]: {
      gridTemplateColumns: "50px minmax(0, 1fr) auto"
    }
  }
});

globalStyle(`${uncopyable} > button`, {
  cursor: "default"
});

const pop = keyframes({
  "0%": { scale: "0.9" },
  "45%": { scale: "1.12" },
  "100%": { scale: "1" }
});

export const icon = style({
  justifySelf: "center",
  width: 40,
  height: 40,
  filter: "drop-shadow(0 4px 0 rgb(0 0 0 / 0.14))",
  transition: `scale 0.18s ${vars.easeOut}`,
  selectors: {
    [`${copyable}:active &`]: {
      scale: "0.9",
      transitionDuration: "0.06s"
    },
    [`${copied} &`]: {
      animation: `${pop} 0.5s ${vars.easeOut}`
    }
  },
  "@container": {
    [narrow]: { width: 34, height: 34 },
    [phone]: { width: 30, height: 30 }
  }
});

export const id = style({
  display: "grid",
  gap: 7,
  minWidth: 0,
  padding: "12px 0",
  "@container": {
    [narrow]: { gap: 6, padding: "4px 0" }
  }
});

export const name = style({
  overflowWrap: "anywhere",
  fontSize: rem(font.h3),
  lineHeight: leading.heading,
  letterSpacing: tracking.title,
  "@container": {
    [phone]: { fontSize: rem(font.h4) },
    [narrowest]: { fontSize: rem(font.text) }
  }
});

export const count = style({
  justifySelf: "start",
  paddingLeft: 3,
  font: figures(),
  letterSpacing: 0
});

globalStyle(`${line} > ${count}`, {
  maxWidth: "100%",
  whiteSpace: "normal",
  overflowWrap: "anywhere"
});

export const empty = style({
  selectors: {
    [`${count}&`]: {
      color: vars.muted
    },
    [`${count}&::before`]: {
      background: "none",
      boxShadow: `inset 0 0 0 2px ${vars.n10}`
    }
  }
});

export const said = style({
  selectors: {
    [`${failed} &`]: {
      ...selectableAboveCover,
      font: figures(1.25),
      letterSpacing: 0,
      whiteSpace: "normal",
      overflowWrap: "anywhere"
    }
  }
});

export const chip = style({
  margin: `${-CHIP_OVERHANG}px ${-CHIP_OVERHANG}px ${-CHIP_OVERHANG}px 2px`,
  selectors: {
    [`${uncopyable} &`]: { visibility: "hidden" }
  }
});

export const glyph = style({
  opacity: DIMMED,
  "@media": {
    [media.hover]: {
      selectors: { [`${copyable}:hover:not(${copied}) &`]: { opacity: 1 } }
    }
  }
});

export const about = style({
  maxWidth: "calc(40ch + 60px)",
  padding: "14px 22px 14px 38px",
  fontSize: rem(font.small),
  lineHeight: leading.snug,
  color: vars.muted,
  textWrap: "balance",
  "@container": {
    [narrow]: { padding: "22px 18px 14px 20px" },
    [phone]: { padding: "22px 16px 14px" }
  }
});
