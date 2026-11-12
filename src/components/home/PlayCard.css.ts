import { createContainer, style } from "@vanilla-extract/css";
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
  userSelect: "all",
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

export const row = style({
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginTop: "auto",
  paddingTop: 12,
  whiteSpace: "nowrap",
});

export const online = style({
  font: figures(),
  color: vars.ink,
});

export const copy = style({
  selectors: {
    [`${play} &`]: { marginLeft: "auto" },
  },
});
