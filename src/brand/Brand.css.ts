import { createVar, globalStyle, style } from "@vanilla-extract/css";
import { font, rem, tracking } from "#app/ui/styles/scale";

export const logoWidth = createVar();
export const nameSize = createVar();

export const brand = style({
  vars: { [logoWidth]: "40px", [nameSize]: `${rem(font.h3)}` },
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: "inherit",
  textDecoration: "none"
});

globalStyle(`${brand} img`, {
  width: logoWidth,
  height: "auto"
});

globalStyle(`${brand} span`, {
  fontSize: nameSize,
  letterSpacing: tracking.heading
});
