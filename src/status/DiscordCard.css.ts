import { style } from "@vanilla-extract/css";
import { font, leading, rem } from "#app/ui/styles/scale";
import { vars } from "#app/ui/styles/theme.css";

const BLURPLE = "#5b6bd7";

export const discord = style({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: "20px 22px",
  background: BLURPLE,
  color: vars.onGround
});

export const compact = style({
  gap: 18
});

export const glyph = style({
  width: 46,
  height: 46,
  selectors: {
    [`${compact} &`]: { width: 34, height: 34 }
  }
});

export const go = style({
  selectors: {
    [`${discord}:hover &`]: { transform: "translate(2px, -2px)" }
  }
});

export const title = style({
  display: "block",
  fontSize: rem(font.h3),
  fontWeight: "inherit",
  lineHeight: leading.tight,
  textWrap: "balance",
  selectors: {
    [`${compact} &`]: { fontSize: rem(font.h4) }
  }
});

export const say = style({
  display: "block",
  maxWidth: "30ch",
  marginTop: 6,
  fontSize: rem(font.small),
  lineHeight: leading.snug,
  opacity: 0.95
});

export const counts = style({
  display: "block",
  marginTop: 10,
  fontSize: rem(font.caption),
  opacity: 0.9
});
