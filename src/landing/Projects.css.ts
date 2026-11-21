import { globalStyle, style } from "@vanilla-extract/css";
import { media } from "#app/ui/styles/media";
import { font, insideOutline, leading, radius, rem, tracking } from "#app/ui/styles/scale";
import { cards, figures } from "./sections";
import { face } from "#app/ui/Card.css";
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
  padding: insideOutline(24)
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
  padding: insideOutline(SMALL_PADDING)
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

globalStyle(`${item} p`, {
  maxWidth: "26ch"
});

globalStyle(`${item} ${version}`, {
  ...artLane,
  gridColumn: 1,
  justifySelf: "start",
  background: "rgb(255 255 255 / 0.45)"
});

export const dark = style({});

globalStyle(`${dark} ${version}`, {
  background: glass
});

export const more = style([
  small,
  {
    vars: { [face]: vars.deep },
    color: vars.onDeep
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

export const logo = style({
  width: 64,
  height: "auto",
  objectFit: "contain",
  filter: "drop-shadow(0 5px 0 rgb(0 0 0 / 0.35))"
});
