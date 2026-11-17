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
  "@media": {
    [media.hover]: {
      selectors: { [`${featured}:hover &`]: { translate: "0 -8px" } }
    }
  }
});

const SMALL_PADDING = 22;
const ART_FROM_RIGHT = 16;
const ART_FROM_BOTTOM = 14;
const ART_LIFT = 8;
const ART_OVERHANG = 4;

const small = style({
  gridColumn: "span 3",
  gridRow: "span 2",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gridTemplateRows: "auto auto 1fr auto",
  padding: SMALL_PADDING
});

globalStyle(`${small} > :is(h3, p)`, {
  gridColumn: "1 / -1"
});

const artLane = {
  gridRow: 4,
  alignSelf: "end",
  marginTop: ART_LIFT + ART_OVERHANG
} as const;

globalStyle(`${small} h3`, {
  fontSize: rem(font.h3),
  lineHeight: leading.tight,
  letterSpacing: tracking.display
});

globalStyle(`${small} p`, {
  marginTop: 8,
  fontSize: rem(font.small),
  lineHeight: leading.snug
});

export const item = style([
  small,
  {
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
  opacity: 0.86
});

globalStyle(`${item} ${version}`, {
  ...artLane,
  gridColumn: 1,
  justifySelf: "start",
  background: "rgb(255 255 255 / 0.45)"
});

export const more = style([
  small,
  {
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
  ...artLane,
  gridColumn: 2,
  marginRight: ART_FROM_RIGHT - SMALL_PADDING,
  marginBottom: ART_FROM_BOTTOM - SMALL_PADDING,
  width: 58,
  maxWidth: "none",
  height: 58,
  transform: "rotate(-8deg)",
  filter: "drop-shadow(0 5px 0 rgb(0 0 0 / 0.16))",
  transition: `transform 0.45s ${vars.easeSpring}`,
  "@media": {
    [media.hover]: {
      selectors: {
        [`${small}:hover &`]: {
          transform: `rotate(0deg) translateY(${-ART_LIFT}px) scale(1.06)`
        }
      }
    }
  }
});

globalStyle(`${more} ${symbol}`, {
  width: 52,
  height: 52,
  filter: "drop-shadow(0 5px 0 rgb(0 0 0 / 0.35))"
});
