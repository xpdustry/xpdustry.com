import { createVar, globalStyle, style } from "@vanilla-extract/css";
import { font, rem, tracking } from "#app/ui/styles/scale";

/** The logo's width. */
export const mark = createVar();
/** The name's font size. */
export const name = createVar();

export const brand = style({
  vars: { [mark]: "40px", [name]: `${rem(font.h3)}` },
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: "inherit",
  textDecoration: "none"
});

globalStyle(`${brand} img`, {
  width: mark,
  height: "auto"
});

globalStyle(`${brand} span`, {
  fontSize: name,
  letterSpacing: tracking.heading
});
