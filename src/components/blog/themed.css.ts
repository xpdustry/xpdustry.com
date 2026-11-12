import { createVar, globalStyle, style } from "@vanilla-extract/css";
import { font, radius } from "#app/styles/scale";
import { vars } from "#app/styles/theme.css";

export const accent = createVar();
export const accentInk = createVar();

const tint = "rgb(255 255 255 / 0.12)";
const tintHover = "rgb(255 255 255 / 0.22)";

export const ground = style({
  color: vars.onGround,
});

export const avatar = style({
  width: 26,
  height: 26,
  borderRadius: "50%",
  background: vars.onGround,
});

export const pill = style({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 12px",
  borderRadius: radius.pill,
  background: tint,
  color: vars.onGround,
  fontSize: font.small,
  textDecoration: "none",
  selectors: {
    "&:has(> img:first-child, > svg:first-child)": { paddingLeft: 8 },
    [`&:has(> ${avatar}:first-child)`]: { padding: "5px 12px 5px 5px" },
    "&:is(a)": { transition: "background-color 0.15s" },
    "&:is(a):hover": { background: tintHover },
  },
});

export const accented = style({
  color: accent,
});

export const solid = style({
  background: accent,
  color: accentInk,
});

export const logoShadow = "rgb(0 0 0 / 0.28)";

export const logo = style({
  filter: `drop-shadow(0 8px 0 ${logoShadow})`,
});

globalStyle(`${pill} > svg`, {
  width: 16,
  height: 16,
});
