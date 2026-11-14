import { globalStyle, style } from "@vanilla-extract/css";
import { CROWN } from "#app/textures/page";
import { media } from "#app/ui/styles/media";
import { font, leading, rem, tracking } from "#app/ui/styles/scale";
import { vars } from "#app/ui/styles/theme.css";
import { footer, ridgeHeight } from "./Footer.css";

export const message = style({
  containerType: "inline-size",
  display: "flex",
  flexGrow: 1,
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "48px 24px",
  color: vars.onDeep,
  textAlign: "center",
  "@media": {
    [media.phone]: { padding: "40px 20px" }
  }
});

globalStyle(`body:has(${message})`, {
  minHeight: "100svh"
});

globalStyle(`body > .wrap:has(> ${message})`, {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gridTemplateRows: `minmax(calc(${CROWN.height}px - ${vars.gap}), max-content) 1fr`,
  paddingBottom: 0
});

globalStyle(`body > .wrap:has(> ${message}) > header`, {
  alignSelf: "start"
});

globalStyle(`body:has(${message}) ${footer}`, {
  marginTop: ridgeHeight
});

export const code = style({
  fontSize: `min(${rem(160)}, 48cqi)`,
  lineHeight: leading.tight,
  letterSpacing: "-0.05em",
  "@media": {
    [media.phone]: { fontSize: `min(${rem(112)}, 48cqi)` }
  }
});

export const title = style({
  marginTop: 20,
  maxWidth: "30ch",
  fontSize: rem(font.h3),
  lineHeight: leading.heading,
  letterSpacing: tracking.heading,
  textWrap: "balance"
});

export const body = style({
  marginTop: 12,
  maxWidth: "46ch",
  fontSize: rem(font.lead),
  lineHeight: leading.snug,
  color: vars.onDeep,
  textWrap: "pretty"
});

export const actions = style({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: 10,
  marginTop: 22
});
