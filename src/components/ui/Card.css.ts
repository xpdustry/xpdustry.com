import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "#app/styles/theme.css";

export const card = style({});

globalStyle(`:where(${card})`, {
  position: "relative",
  isolation: "isolate",
  overflow: "hidden",
  border: `2px solid ${vars.outline}`,
  borderRadius: vars.r,
  background: vars.tile,
  color: "inherit",
  textDecoration: "none",
});
