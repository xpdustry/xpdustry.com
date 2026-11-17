import { globalStyle, style } from "@vanilla-extract/css";
import { media } from "#app/ui/styles/media";
import { font, insideOutline, leading, rem, tracking } from "#app/ui/styles/scale";
import { figures } from "./sections";
import { face, selectableAboveCover } from "#app/ui/Card.css";
import { vars } from "#app/ui/styles/theme.css";

export const play = style({
  containerType: "inline-size",
  display: "flex",
  flexDirection: "column",
  padding: insideOutline(22, 24),
  vars: { [face]: vars.a3 }
});

export const label = style({
  fontSize: rem(font.small),
  color: vars.a11
});

export const failed = style({});

export const address = style({
  marginTop: "auto",
  font: `500 clamp(${rem(16)}, calc(100cqi / 11.8), ${rem(30)}) / ${leading.heading} ${vars.fontMono}`,
  letterSpacing: tracking.heading,
  color: vars.ink,
  overflowWrap: "anywhere",
  selectors: {
    [`${failed} &`]: {
      ...selectableAboveCover,
      alignSelf: "start"
    }
  }
});

export const how = style({
  marginTop: 6,
  fontSize: rem(font.caption),
  color: vars.a11,
  textWrap: "balance"
});

export const foot = style({
  alignSelf: "start",
  marginTop: "auto",
  paddingTop: 12
});

export const online = style({
  font: figures(),
  color: vars.ink,
  overflowWrap: "anywhere"
});

globalStyle(`${play} ${online}`, {
  whiteSpace: "normal"
});

export const hint = style({
  color: vars.a11,
  "@media": {
    [media.hover]: {
      selectors: { [`${play}:has(> button:hover) &`]: { transform: "scale(1.08)" } }
    }
  }
});
