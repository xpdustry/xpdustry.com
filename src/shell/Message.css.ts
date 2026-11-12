import { globalStyle, style } from "@vanilla-extract/css";
import { media } from "#app/ui/styles/media";
import { font, leading, rem } from "#app/ui/styles/scale";
import { displayTitle } from "#app/ui/styles/titles";
import { vars } from "#app/ui/styles/theme.css";

export const message = style({
  minHeight: 360,
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  padding: "34px 38px",
  background: vars.t3,
  color: vars.t12,
  "@media": {
    [media.phone]: { padding: "28px 24px" }
  }
});

export const code = style({
  font: `500 ${rem(font.small)} ${vars.fontMono}`,
  opacity: 0.8
});

export const title = style({
  marginTop: 10,
  maxWidth: "16ch",
  ...displayTitle(font.h1)
});

export const body = style({
  marginTop: 14,
  fontSize: rem(font.lead),
  lineHeight: leading.snug
});

globalStyle(`${body} > div`, {
  display: "flex",
  flexWrap: "wrap",
  gap: 10
});

globalStyle(`${body} > :last-child`, {
  marginTop: 18
});
