import { createContainer, keyframes, style } from "@vanilla-extract/css";
import { media } from "#app/styles/media";
import { font, leading, tracking } from "#app/styles/scale";
import { figures } from "./shared";
import { vars } from "#app/styles/theme.css";

const card = createContainer();

export const play = style({
  containerName: card,
  containerType: "inline-size",
  display: "flex",
  flexDirection: "column",
  padding: "22px 24px",
  background: vars.a3,
});

export const label = style({
  fontSize: font.small,
  color: vars.a11,
});

export const address = style({
  marginTop: "auto",
  font: `500 clamp(16px, calc(100cqi / 11.8), 30px) / ${leading.heading} ${vars.fontMono}`,
  letterSpacing: tracking.heading,
  color: vars.ink,
  whiteSpace: "nowrap",
  "@container": {
    [`${card} (max-width: 180px)`]: { whiteSpace: "normal" },
  },
});

export const how = style({
  marginTop: 6,
  fontSize: font.caption,
  color: vars.a11,
  textWrap: "balance",
});

export const online = style({
  alignSelf: "start",
  marginTop: "auto",
  paddingTop: 12,
  font: figures(),
  color: vars.ink,
});

export const copied = style({});

const pop = keyframes({
  "0%": { scale: "0.9" },
  "45%": { scale: "1.12" },
  "100%": { scale: "1" },
});

export const hint = style({
  color: vars.a11,
  selectors: {
    [`${play}:has(> button:hover) &`]: { transform: "scale(1.08)" },
    [`${copied} &`]: {
      background: vars.t9,
      color: vars.onTeal,
      "@media": { [media.motion]: { animation: `${pop} 0.5s ${vars.easeOut}` } },
    },
  },
});
