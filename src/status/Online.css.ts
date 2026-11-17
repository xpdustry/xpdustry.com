import { createVar, style } from "@vanilla-extract/css";
import { vars } from "#app/ui/styles/theme.css";

const light = createVar();

export const online = style({
  vars: { [light]: vars.online },
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  whiteSpace: "nowrap",

  "::before": {
    content: '""',
    flex: "none",
    width: 14,
    height: 14,
    borderRadius: "50%",
    background: light,
    backgroundClip: "padding-box",
    border: `3px solid color-mix(in srgb, ${light} 22%, transparent)`
  }
});

export const offline = style({
  vars: { [light]: vars.n10 }
});
