import { createVar, globalStyle, style } from "@vanilla-extract/css";
import { font, tracking } from "#app/styles/scale";

/** The logo's width. */
export const mark = createVar();
/** The name's font size. */
export const name = createVar();

export const brand = style({
  vars: { [mark]: "40px", [name]: `${font.h3}px` },
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: "inherit",
  textDecoration: "none",
});

globalStyle(`${brand} img`, {
  width: mark,
  height: "auto",
});

globalStyle(`${brand} span`, {
  fontSize: name,
  letterSpacing: tracking.heading,
});
