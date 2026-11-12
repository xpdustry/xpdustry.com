import { globalStyle, style } from "@vanilla-extract/css";
import { media } from "#app/styles/media";
import { font, leading, rem, tracking } from "#app/styles/scale";
import { vars } from "#app/styles/theme.css";

export const intro = style({
  gridColumn: "span 8",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  minHeight: 230,
  padding: "34px 38px",
  background: vars.t3,
  color: vars.t12,
  "@media": {
    [media.tablet]: { gridColumn: "span 6" },
  },
});

globalStyle(`${intro} h1`, {
  fontSize: rem(font.hero),
  lineHeight: leading.tight,
  letterSpacing: tracking.display,
  "@media": {
    [media.phone]: { fontSize: rem(font.display) },
  },
});

globalStyle(`${intro} p`, {
  maxWidth: "36ch",
  marginTop: 12,
  fontSize: rem(font.lead),
  lineHeight: leading.snug,
  opacity: 0.85,
});

export const ask = style({
  gridColumn: "span 4",
  "@media": {
    [media.tablet]: { gridColumn: "span 6" },
  },
});

export const wide = style({
  gridColumn: "1 / -1",
});

export const empty = style([wide, { color: vars.onDeep }]);

export const tile = style({
  gridColumn: "span 6",
  minHeight: 360,
  "@media": {
    [media.phone]: { gridColumn: "1 / -1", minHeight: 400 },
  },
});
