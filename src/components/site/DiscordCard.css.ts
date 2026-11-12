import { globalStyle, style } from "@vanilla-extract/css";
import { font, leading, radius } from "#app/styles/scale";
import { vars } from "#app/styles/theme.css";

const BLURPLE = "#5b6bd7";

export const discord = style({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: "20px 22px",
  background: BLURPLE,
  color: vars.onGround,
});

export const compact = style({
  gap: 18,
});

export const glyph = style({
  width: 46,
  height: 46,
  selectors: {
    [`${compact} &`]: { width: 34, height: 34 },
  },
});

export const go = style({
  position: "absolute",
  top: 16,
  right: 16,
  display: "grid",
  placeItems: "center",
  width: 34,
  height: 34,
  borderRadius: radius.md,
  background: "rgb(255 255 255 / 0.16)",
  transition: `transform 0.25s ${vars.easeSpring}`,
  selectors: {
    [`${discord}:hover &`]: { transform: "translate(2px, -2px)" },
  },
});

globalStyle(`${go} svg`, {
  width: 18,
  height: 18,
});

export const title = style({
  display: "block",
  fontSize: font.h3,
  fontWeight: "inherit",
  lineHeight: leading.tight,
  selectors: {
    [`${compact} &`]: { fontSize: font.h4 },
  },
});

export const say = style({
  display: "block",
  maxWidth: "30ch",
  marginTop: 6,
  fontSize: font.small,
  lineHeight: leading.snug,
  opacity: 0.95,
});

export const counts = style({
  display: "block",
  marginTop: 10,
  fontSize: font.caption,
  opacity: 0.9,
});
