import { createVar, fallbackVar, globalStyle, style, styleVariants } from "@vanilla-extract/css";
import { media } from "#app/styles/media";
import { font, leading } from "#app/styles/scale";
import { vars } from "#app/styles/theme.css";
import { artLogo, artTop } from "./PostArt.css";

/** How far above the title the card starts, over the photo. */
const fade = createVar();
/** The tile's padding at its sides, and at its foot. */
const pad = createVar();
const padFoot = createVar();
/** Where the fringe starts, so neighbouring tiles fray differently. */
const fray = createVar();

export const tile = style({
  vars: {
    [pad]: "22px",
    [padFoot]: "22px",
  },
  display: "flex",
  flexDirection: "column",
  justifyContent: "end",
  padding: `${padFoot} ${pad}`,
  color: vars.ink,
});

/**
 * The headline of the news tray, a smaller news card, or a blog listing card with the description:
 * how far the fade reaches, and the size and place of the logo standing in for a photo the post
 * lacks. Declared after `tile`, so `small`'s padding wins over its.
 */
export const variant = styleVariants({
  big: {
    vars: { [fade]: "54px", [artLogo]: "112px", [artTop]: "40px" },
  },
  small: {
    vars: {
      [fade]: "38px",
      [artLogo]: "56px",
      [artTop]: "14px",
      [pad]: "20px",
      [padFoot]: "16px",
    },
    "@media": {
      // the logo drops below the topic chip, which it would run into
      [media.phone]: { vars: { [artTop]: "54px" } },
    },
  },
  listing: {
    vars: { [fade]: "46px", [artLogo]: "96px", [artTop]: "26px" },
    "@media": {
      [media.phone]: { vars: { [artTop]: "54px" } },
    },
  },
});

/** The card under the photo, out to the tile's edges: what holds the title, and the patches. */
export const foot = style({
  position: "relative",
  isolation: "isolate",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  margin: `0 calc(-1 * ${pad}) calc(-1 * ${padFoot})`,
  padding: `calc(${fade} + 14px) ${pad} ${padFoot}`,
  background: 'url("../../assets/fade.webp") 0 0 / 240px',
  // its top edge frays up into the photo: the card, texture and patches and all, is cut to a
  // rising fringe at three quarters its size, started somewhere else on each tile by `fray`
  mask: [
    `url("../../assets/fringe/f7fdfd-rise.webp") ${fallbackVar(fray, "0")} 0 / 486px 48px repeat-x`,
    "linear-gradient(#000 0 0) 0 47px / 100% calc(100% - 47px) no-repeat",
  ].join(", "),
  selectors: {
    [`${tile}:nth-child(2n) &`]: { vars: { [fray]: "-210px" } },
    [`${tile}:nth-child(3n) &`]: { vars: { [fray]: "-95px" } },
  },
});

export const photo = style({
  position: "absolute",
  inset: 0,
  zIndex: -2,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  // a screenshot's words start at its left edge: cut the far side, not through them
  objectPosition: "left top",
  transition: `scale 0.6s ${vars.easeOut}`,
  selectors: {
    [`${tile}:hover &`]: { scale: "1.04" },
  },
});

export const chip = style({
  alignSelf: "start",
  marginBottom: "auto",
});

export const title = style({
  fontSize: font.h4,
  lineHeight: leading.heading,
  textWrap: "balance",
});

export const byline = style({
  marginTop: 8,
  fontSize: font.caption,
  color: vars.muted,
});

globalStyle(`${variant.big} ${title}`, {
  maxWidth: "20ch",
  fontSize: font.h2,
  "@media": {
    [media.phone]: { fontSize: font.h3 },
  },
});

globalStyle(`${variant.small} ${title}`, {
  fontSize: font.lead,
});

globalStyle(`${variant.small} ${byline}`, {
  marginTop: 4,
});

globalStyle(`${variant.listing} ${title}`, {
  fontSize: font.h3,
});

export const description = style({
  maxWidth: "48ch",
  marginTop: 8,
  fontSize: font.small,
  lineHeight: leading.snug,
  color: vars.muted,
});

globalStyle(`${variant.listing} ${byline}`, {
  marginTop: 10,
});
