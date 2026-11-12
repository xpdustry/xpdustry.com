import { globalStyle, style } from "@vanilla-extract/css";
import { media } from "#app/ui/styles/media";
import { font, leading, radius, rem, tracking } from "#app/ui/styles/scale";
import { cards, figures } from "./sections";
import { vars } from "#app/ui/styles/theme.css";

const glass = "rgb(255 255 255 / 0.12)";

export const projects = cards(104);

export const version = style({
  padding: "6px 8px",
  borderRadius: radius.sm,
  font: figures()
});

export const featured = style({
  gridColumn: "span 6",
  gridRow: "span 4",
  display: "flex",
  flexDirection: "column",
  padding: 24,
  color: vars.onGround,
  "@media": {
    [media.phone]: { minHeight: 300 }
  }
});

export const top = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 10
});

globalStyle(`${top} h3`, {
  minWidth: 0
});

globalStyle(`${top} img`, {
  width: 34
});

globalStyle(`${featured} h3`, {
  fontSize: rem(font.h2),
  letterSpacing: tracking.display
});

globalStyle(`${featured} ${version}`, {
  marginLeft: "auto",
  background: glass
});

globalStyle(`${featured} p`, {
  maxWidth: "40ch",
  marginTop: 8,
  fontSize: rem(font.small),
  lineHeight: leading.snug
});

/** Holds the screenshot without giving it height, so the card is as tall as its text needs. */
export const stage = style({
  position: "relative",
  flex: "none",
  height: 0
});

export const screenshot = style({
  position: "absolute",
  top: 0,
  left: 0,
  width: "calc(100% + 44px)",
  maxWidth: "none",
  marginTop: 19,
  border: `1px solid ${glass}`,
  borderRadius: radius.md,
  boxShadow: "0 20px 50px -18px rgb(0 0 0 / 0.7)",
  transition: `translate 0.45s ${vars.easeOut}`,
  selectors: {
    [`${featured}:hover &`]: { translate: "0 -8px" }
  }
});

const small = style({
  gridColumn: "span 3",
  gridRow: "span 2",
  display: "flex",
  flexDirection: "column"
});

globalStyle(`${small} h3`, {
  fontSize: rem(font.h3),
  lineHeight: leading.tight,
  letterSpacing: tracking.display
});

globalStyle(`${small} p`, {
  fontSize: rem(font.small),
  lineHeight: leading.snug
});

export const item = style([
  small,
  {
    padding: 22,
    color: "#1a1310"
  }
]);

globalStyle(`${item}:nth-child(1 of ${item})`, {
  "@media": {
    [media.tablet]: { gridColumn: "span 6" }
  }
});

globalStyle(`${item} p`, {
  maxWidth: "26ch",
  marginTop: 8,
  opacity: 0.86,
  "@media": {
    [media.phone]: { marginBottom: 12 }
  }
});

globalStyle(`${item} ${version}`, {
  alignSelf: "start",
  marginTop: "auto",
  background: "rgb(255 255 255 / 0.45)"
});

export const more = style([
  small,
  {
    gap: 6,
    padding: 24,
    background: vars.deep,
    color: vars.onDeep,
    "@media": {
      [media.tablet]: { gridColumn: "span 6" }
    }
  }
]);

globalStyle(`${more} p`, {
  maxWidth: "24ch",
  color: vars.deepInk
});

export const symbol = style({
  position: "absolute",
  right: 16,
  bottom: 14,
  width: 58,
  height: 58,
  transform: "rotate(-8deg)",
  filter: "drop-shadow(0 5px 0 rgb(0 0 0 / 0.16))",
  transition: `transform 0.45s ${vars.easeSpring}`,
  selectors: {
    [`${small}:hover &`]: { transform: "rotate(0deg) translateY(-8px) scale(1.06)" }
  }
});

globalStyle(`${more} ${symbol}`, {
  width: 52,
  height: 52,
  filter: "drop-shadow(0 5px 0 rgb(0 0 0 / 0.35))"
});
