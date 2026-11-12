import { createVar, style } from "@vanilla-extract/css";
import { vars } from "#app/styles/theme.css";

const light = createVar();

export const online = style({
  vars: { [light]: vars.online },
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  whiteSpace: "nowrap",

  "::before": {
    content: '""',
    flex: "none",
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: light,
    boxShadow: `0 0 0 3px color-mix(in srgb, ${light} 22%, transparent)`,
  },
});

export const offline = style({
  vars: { [light]: vars.n10 },
});
