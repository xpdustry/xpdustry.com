import { createVar, globalStyle, style, styleVariants } from "@vanilla-extract/css";
import { font, radius } from "#app/styles/scale";
import { vars } from "#app/styles/theme.css";

const depth = createVar();
const faceColor = createVar();
const hoverColor = createVar();
const onColor = createVar();
/** The wall's colour, and the face's edge. Exported for a plinth on the deep teal to retune. */
export const wall = createVar();

const TEAL_HOVER = "#62d4cd";
const AMBER_HOVER = "#ffe0a8";

interface Palette {
  face: string;
  hover: string;
  wall: string;
  on: string;
}

const palette = (colors: Palette) => ({
  [faceColor]: colors.face,
  [hoverColor]: colors.hover,
  [wall]: colors.wall,
  [onColor]: colors.on,
});

const teal: Palette = { face: vars.t9, hover: TEAL_HOVER, wall: vars.wall, on: vars.onTeal };

export const plinth = style({
  vars: { [depth]: "4px", ...palette(teal) },
  position: "relative",
  display: "inline-flex",
  marginTop: depth,
  padding: 0,
  border: `2px solid ${wall}`,
  borderRadius: radius.md,
  background: wall,
  color: onColor,
  font: "inherit",
  textDecoration: "none",
  cursor: "pointer",
});

export const tone = styleVariants({
  amber: {
    vars: palette({ face: vars.a9, hover: AMBER_HOVER, wall: vars.amberWall, on: vars.onAmber }),
  },
  ink: { vars: palette({ face: vars.tile, hover: vars.n3, wall: vars.outline, on: vars.ink }) },
});

export const done = style({});

globalStyle(`${plinth}[aria-current]:not([href*="#"]), ${done}`, {
  vars: palette({ ...teal, hover: teal.face }),
});

export const sm = style({});

export const icon = style({});

export const face = style({
  display: "flex",
  alignItems: "center",
  gap: 9,
  margin: -2,
  padding: "9px 16px",
  border: `2px solid ${wall}`,
  borderRadius: "inherit",
  background: `${faceColor} linear-gradient(rgb(255 255 255 / 0.26) 0 45%, transparent 45%)`,
  fontSize: font.small,
  transform: `translateY(calc(${depth} * -1))`,
  transition: `transform 0.19s ${vars.easeOut}, background-color 0.13s`,
  selectors: {
    [`${sm} > &`]: { padding: "7px 13px" },
    [`${icon} > &`]: { padding: 8 },
    [`${plinth}:hover > &`]: {
      transform: `translateY(calc(${depth} * -1 - 2px))`,
      backgroundColor: hoverColor,
    },
    [`${plinth}:active > &`]: {
      transform: "none",
      transitionDuration: "0.06s",
    },
  },
});

globalStyle(`${plinth} svg`, {
  width: 18,
  height: 18,
});
