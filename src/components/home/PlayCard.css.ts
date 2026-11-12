import { globalStyle, style } from "@vanilla-extract/css";
import { font, leading, rem, tracking } from "#app/ui/styles/scale";
import { figures } from "./shared";
import { vars } from "#app/ui/styles/theme.css";

export const play = style({
  containerType: "inline-size",
  display: "flex",
  flexDirection: "column",
  padding: "22px 24px",
  background: vars.a3
});

export const label = style({
  fontSize: rem(font.small),
  color: vars.a11
});

/** The browser refused the copy: the address is for the visitor to select instead. */
export const failed = style({});

export const address = style({
  marginTop: "auto",
  font: `500 clamp(${rem(16)}, calc(100cqi / 11.8), ${rem(30)}) / ${leading.heading} ${vars.fontMono}`,
  letterSpacing: tracking.heading,
  color: vars.ink,
  overflowWrap: "anywhere",
  selectors: {
    // Above the button covering the card, so a press selects the address instead of copying.
    [`${failed} &`]: {
      position: "relative",
      zIndex: 2,
      alignSelf: "start",
      userSelect: "all",
      cursor: "text"
    }
  }
});

export const how = style({
  marginTop: 6,
  fontSize: rem(font.caption),
  color: vars.a11,
  textWrap: "balance"
});

export const online = style({
  alignSelf: "start",
  marginTop: "auto",
  paddingTop: 12,
  font: figures(),
  color: vars.ink
});

globalStyle(`${play} ${online}`, {
  whiteSpace: "normal"
});

export const hint = style({
  color: vars.a11,
  selectors: {
    [`${play}:has(> button:hover) &`]: { transform: "scale(1.08)" }
  }
});
