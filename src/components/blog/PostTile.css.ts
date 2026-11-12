import { createVar, fallbackVar, globalStyle, style, styleVariants } from "@vanilla-extract/css";
import { media } from "#app/styles/media";
import { font, leading, rem } from "#app/styles/scale";
import { vars } from "#app/styles/theme.css";
import { artLogo, artTop } from "./PostArt.css";

const fade = createVar();
const pad = createVar();
const padFoot = createVar();
const fray = createVar();

const roomy = { [pad]: "22px", [padFoot]: "22px" };

export const tile = style({
  display: "flex",
  flexDirection: "column",
  justifyContent: "end",
  padding: `${padFoot} ${pad}`,
  color: vars.ink
});

export const variant = styleVariants({
  big: {
    vars: { ...roomy, [fade]: "54px", [artLogo]: "112px", [artTop]: "40px" }
  },
  small: {
    vars: {
      [fade]: "38px",
      [artLogo]: "56px",
      [artTop]: "14px",
      [pad]: "20px",
      [padFoot]: "16px"
    },
    "@media": {
      [media.phone]: { vars: { [artTop]: "54px" } }
    }
  },
  listing: {
    vars: { ...roomy, [fade]: "46px", [artLogo]: "96px", [artTop]: "26px" },
    "@media": {
      [media.phone]: { vars: { [artTop]: "54px" } }
    }
  }
});

export const foot = style({
  position: "relative",
  isolation: "isolate",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  margin: `0 calc(-1 * ${pad}) calc(-1 * ${padFoot})`,
  padding: `calc(${fade} + 14px) ${pad} ${padFoot}`,
  background: 'url("../../textures/assets/fade.webp") 0 0 / 240px',
  mask: [
    `url("../../textures/assets/fringe/f7fdfd-rise.webp") ${fallbackVar(fray, "0")} 0 / 486px 48px repeat-x`,
    "linear-gradient(#000 0 0) 0 47px / 100% calc(100% - 47px) no-repeat"
  ].join(", "),
  selectors: {
    [`${tile}:nth-child(2n) &`]: { vars: { [fray]: "-210px" } },
    [`${tile}:nth-child(3n) &`]: { vars: { [fray]: "-95px" } }
  }
});

export const photo = style({
  position: "absolute",
  inset: 0,
  zIndex: -2,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  objectPosition: "left top",
  transition: `scale 0.6s ${vars.easeOut}`,
  selectors: {
    [`${tile}:hover &`]: { scale: "1.04" }
  }
});

export const chip = style({
  alignSelf: "start",
  marginBottom: "auto"
});

export const title = style({
  fontSize: rem(font.h4),
  lineHeight: leading.heading,
  textWrap: "balance"
});

export const byline = style({
  marginTop: 8,
  fontSize: rem(font.caption),
  color: vars.muted
});

globalStyle(`${variant.big} ${title}`, {
  maxWidth: "20ch",
  fontSize: rem(font.h2),
  "@media": {
    [media.phone]: { fontSize: rem(font.h3) }
  }
});

globalStyle(`${variant.small} ${title}`, {
  fontSize: rem(font.lead)
});

globalStyle(`${variant.small} ${byline}`, {
  marginTop: 4
});

globalStyle(`${variant.listing} ${title}`, {
  fontSize: rem(font.h3)
});

export const description = style({
  maxWidth: "48ch",
  marginTop: 8,
  fontSize: rem(font.small),
  lineHeight: leading.snug,
  color: vars.muted
});

globalStyle(`${variant.listing} ${byline}`, {
  marginTop: 10
});
