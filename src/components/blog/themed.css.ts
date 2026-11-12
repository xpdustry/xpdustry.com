import { createVar, globalStyle, style } from "@vanilla-extract/css";
import { font, radius } from "#app/styles/scale";

/**
 * What the lead post and a post's cover share, dressed in their topic's colours by `themed()`:
 * white text and translucent pills on the topic's ground, and its logo standing out of it.
 */

/** The topic's own light colour, and the ink on it. */
export const accent = createVar();
export const accentInk = createVar();

/** Text on a topic's ground, which may be any dark colour. */
export const onGround = "#fff";

/** The tint of a pill on the ground, and of one under the pointer. */
const tint = "rgb(255 255 255 / 0.12)";
const tintHover = "rgb(255 255 255 / 0.22)";

/** The ground itself; a card's own border and corners come from `card`. */
export const ground = style({
  color: onGround,
});

export const avatar = style({
  width: 26,
  height: 26,
  borderRadius: "50%",
  background: onGround,
});

/** A label or a link on the ground; one that leads with an icon or an avatar tucks it in. */
export const pill = style({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 12px",
  borderRadius: radius.pill,
  background: tint,
  color: onGround,
  fontSize: font.small,
  textDecoration: "none",
  selectors: {
    "&:has(> img:first-child, > svg:first-child)": { paddingLeft: 8 },
    [`&:has(> ${avatar}:first-child)`]: { padding: "5px 12px 5px 5px" },
    "&:is(a)": { transition: "background-color 0.15s" },
    "&:is(a):hover": { background: tintHover },
  },
});

/** The topic's own colour, for what names it. */
export const accented = style({
  color: accent,
});

/** In the topic's colour itself, for what stands out most. */
export const solid = style({
  background: accent,
  color: accentInk,
});

/** The project's logo, lifted off the ground by a hard shadow. */
export const logoShadow = "rgb(0 0 0 / 0.28)";

export const logo = style({
  filter: `drop-shadow(0 8px 0 ${logoShadow})`,
});

globalStyle(`${pill} > svg`, {
  width: 16,
  height: 16,
});
