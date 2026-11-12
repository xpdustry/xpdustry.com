import { globalStyle, style } from "@vanilla-extract/css";
import { font, leading, radius } from "#app/styles/scale";
import { vars } from "#app/styles/theme.css";

export const wrapper = style({
  position: "relative",
  display: "flex",
});

const code = {
  font: `500 ${font.caption}px / ${leading.tight} ${vars.fontMono}`,
  textTransform: "uppercase",
} as const;

export const button = style({});

globalStyle(`${button} > span`, {
  ...code,
  minWidth: "2ch",
  padding: "9.5px 11px",
});

export const list = style({
  display: "flex",
  flexDirection: "column",
  gap: 2,
});

export const panel = style({
  position: "absolute",
  top: "calc(100% + 10px)",
  right: 0,
  zIndex: 6,
  display: "none",
  minWidth: 170,
  padding: 8,
  border: `2px solid ${vars.deepWall}`,
  borderRadius: radius.lg,
  background: vars.deep,
  boxShadow: "0 18px 40px -12px rgb(0 0 0 / 0.55)",
});

export const open = style({
  selectors: {
    [`${panel}&`]: { display: "flex" },
  },
});

export const option = style({
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  padding: "9px 10px",
  border: 0,
  borderRadius: radius.sm,
  background: "none",
  fontSize: font.small,
  textAlign: "start",
  cursor: "pointer",
  selectors: {
    "&:hover": { background: "rgb(255 255 255 / 0.08)" },
    '&[aria-current="true"]': { color: vars.t9, cursor: "default" },
  },
});

export const codeLabel = style({
  ...code,
  minWidth: "2ch",
  color: vars.deepInk,
});

export { codeLabel as code };

export const tick = style({
  width: 16,
  height: 16,
  marginLeft: "auto",
});
