import { createVar, globalStyle, keyframes, style } from "@vanilla-extract/css";
import { media, narrowerThan } from "#app/styles/media";
import { font, leading, rem, tracking } from "#app/styles/scale";
import { figures } from "./shared";
import { vars } from "#app/styles/theme.css";

const narrow = narrowerThan(660);
const phone = narrowerThan(440);
const narrowest = narrowerThan(270);

const bandWidth = createVar();
const headHeight = createVar();
export const tint = createVar();

export const total = style({
  color: vars.ink
});

export const modes = style({
  display: "grid",
  gap: 10
});

export const mode = style({
  vars: { [bandWidth]: `clamp(${rem(342)}, 32cqi, ${rem(372)})` },
  display: "grid",
  gridTemplateColumns: `${bandWidth} minmax(0, 1fr)`,
  alignItems: "center",
  selectors: {
    "&::before": {
      content: "",
      position: "absolute",
      inset: 0,
      zIndex: -2,
      background: 'url("../../textures/assets/fade.webp") 0 -60px / 240px'
    }
  },
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

export const copied = style({});
export const failed = style({});

export const tinted = style({
  position: "absolute",
  inset: "0 auto 0 0",
  zIndex: -2,
  width: `calc(${bandWidth} - 34px)`,
  background: tint,
  "@container": {
    [narrow]: {
      gridArea: "1 / 1 / 2 / 2",
      inset: "0 0 22px",
      width: "auto"
    }
  }
});

export const edge = style({
  position: "absolute",
  selectors: {
    [`${mode}:is(:hover, :has(:focus-visible)) &`]: {
      vars: { "--grow": "1" }
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

export const below = style({
  display: "none",
  "@container": {
    [narrow]: {
      inset: "100% 0 auto",
      display: "block",
      height: 48,
      background: "0 0 / 486px 48px repeat-x",
      selectors: {
        [`${mode}:nth-child(2) &`]: { backgroundPositionX: -190 },
        [`${mode}:nth-child(3) &`]: { backgroundPositionX: -75 },
        [`${mode}:nth-child(4) &`]: { backgroundPositionX: -330 },
        [`${mode}:nth-child(5) &`]: { backgroundPositionX: -255 }
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

globalStyle(`${mode} > button:disabled`, {
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
    [`${mode}:active &`]: {
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

export const line = style({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  overflow: "hidden",
  // Room for the letters' ascenders and tails, which grow with the text.
  margin: "-0.25em 0",
  padding: "0.25em 0"
});

globalStyle(`${line} > *`, {
  gridArea: "1 / 1",
  transition: `translate 0.32s ${vars.easeOut}, opacity 0.2s`
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
  overflow: "hidden",
  fontSize: rem(font.caption),
  lineHeight: leading.tight,
  whiteSpace: "nowrap",
  translate: "0 110%",
  opacity: 0,
  selectors: {
    [`${copied} &`]: {
      lineHeight: leading.snug,
      whiteSpace: "normal"
    },
    // Above the button covering the card, so a press selects the address instead of copying.
    [`${failed} &`]: {
      position: "relative",
      zIndex: 2,
      font: figures(1.25),
      letterSpacing: 0,
      whiteSpace: "normal",
      overflowWrap: "anywhere",
      userSelect: "all",
      cursor: "text"
    }
  },
  "@media": {
    [media.still]: { translate: "none" }
  }
});

globalStyle(`:is(${copied}, ${failed}) ${count}`, {
  translate: "0 -110%",
  opacity: 0,
  "@media": {
    [media.still]: { translate: "none" }
  }
});

globalStyle(`:is(${copied}, ${failed}) ${said}`, {
  translate: "0",
  opacity: 1
});

export const mark = style({
  // The chip is wider than its icon; the margins keep the band laid out around the icon alone.
  margin: "-8px -8px -8px 2px"
});

globalStyle(`${mark} svg`, {
  gridArea: "1 / 1",
  width: 18,
  height: 18,
  transition: `scale 0.28s ${vars.easeOut}, rotate 0.28s ${vars.easeOut}, opacity 0.16s`
});

export const glyph = style({
  opacity: 0.75,
  selectors: {
    [`${mode}:hover &`]: {
      opacity: 1
    },
    [`${mode}${copied} &`]: {
      scale: "0.4",
      opacity: 0
    }
  },
  "@media": {
    [media.still]: {
      selectors: {
        [`${mode}${copied} &`]: { scale: "1", rotate: "none" }
      }
    }
  }
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
      transitionTimingFunction: vars.easeSpring
    }
  },
  "@media": {
    [media.still]: { scale: "1", rotate: "none" }
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
