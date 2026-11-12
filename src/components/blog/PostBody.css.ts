import { createVar, globalStyle, style } from "@vanilla-extract/css";
import { media } from "#app/styles/media";
import { font, leading, radius, tracking } from "#app/styles/scale";
import { vars } from "#app/styles/theme.css";

/** A post's text, styled by tag: the Markdown renders plain elements. */
export const prose = style({
  maxWidth: "66ch",
  fontFamily: vars.fontText,
  fontSize: font.lead,
  lineHeight: leading.text,
  letterSpacing: 0,
  color: vars.ink,
  "@media": {
    [media.phone]: { fontSize: font.text },
  },
});

globalStyle(`${prose} > * + *`, {
  marginTop: 16,
});

globalStyle(`${prose} h2, ${prose} h3`, {
  marginTop: 44,
  fontFamily: vars.fontDisplay,
  lineHeight: leading.heading,
  letterSpacing: tracking.title,
});

globalStyle(`${prose} h2`, {
  fontSize: font.h2,
});

globalStyle(`${prose} h3`, {
  fontSize: font.h3,
});

globalStyle(`${prose} :is(h2, h3) + *`, {
  marginTop: 12,
});

globalStyle(`${prose} strong`, {
  fontWeight: 650,
});

globalStyle(`${prose} a`, {
  borderRadius: radius.xs,
  color: "inherit",
  textDecoration: `underline 2px ${vars.t9}`,
  textUnderlineOffset: 4,
});

globalStyle(`${prose} a:hover`, {
  background: `rgb(${vars.glow} / 0.18)`,
});

globalStyle(`${prose} code`, {
  padding: "0.14em 0.42em",
  border: `1px solid color-mix(in srgb, ${vars.outline} 22%, transparent)`,
  borderRadius: radius.sm,
  background: vars.n3,
  font: `500 0.84em ${vars.fontMono}`,
  whiteSpace: "nowrap",
});

globalStyle(`${prose} li`, {
  position: "relative",
  paddingLeft: 28,
});

globalStyle(`${prose} li + li`, {
  marginTop: 10,
});

globalStyle(`${prose} li::before`, {
  content: '""',
  position: "absolute",
  top: "0.6em",
  left: 3,
  width: 10,
  height: 10,
  borderRadius: radius.xs,
  background: vars.t9,
  boxShadow: `0 0 0 2px ${vars.wall}`,
});

globalStyle(`${prose} ol`, {
  paddingLeft: "1.4em",
  listStyle: "decimal",
});

globalStyle(`${prose} ol li`, {
  paddingLeft: 4,
});

globalStyle(`${prose} ol li::before`, {
  content: "none",
});

globalStyle(`${prose} figure`, {
  margin: "36px 0",
});

globalStyle(`${prose} figure img, ${prose} figure video`, {
  display: "block",
  width: "100%",
  height: "auto",
  border: `2px solid ${vars.outline}`,
  borderRadius: radius.lg,
  background: vars.stage,
});

globalStyle(`${prose} figcaption`, {
  marginTop: 10,
  fontSize: font.small,
  lineHeight: leading.snug,
  color: vars.muted,
});

/** A callout's pale ground, in its label's hue. */
const tealWash = "#dcf4f1";
const amberWash = "#fff2d9";

// the label's colours, which each kind of callout sets
const wall = createVar();
const face = createVar();
const on = createVar();

/** A note, the default for every kind but `warning`. */
export const callout = style({
  vars: {
    [wall]: vars.wall,
    [face]: vars.t9,
    [on]: vars.onTeal,
  },
  margin: "16px 0 30px",
  padding: "18px 22px 20px",
  border: `2px solid ${vars.outline}`,
  borderRadius: radius.lg,
  background: tealWash,
});

export const warning = style({
  vars: {
    [wall]: vars.amberWall,
    [face]: vars.a9,
    [on]: vars.onAmber,
  },
  background: amberWash,
});

export const label = style({
  display: "inline-block",
  marginBottom: 8,
  padding: "4px 11px",
  border: `2px solid ${wall}`,
  borderRadius: radius.sm,
  background: face,
  color: on,
  fontFamily: vars.fontDisplay,
  fontSize: font.small,
  letterSpacing: tracking.title,
});

globalStyle(`${callout} p`, {
  fontSize: font.text,
});
