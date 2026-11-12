import { createVar, fallbackVar, globalStyle, style } from "@vanilla-extract/css";
import { media } from "#app/styles/media";
import { font, leading, tracking } from "#app/styles/scale";
import { vars } from "#app/styles/theme.css";

/** The name's font size, and the most it may grow to. */
const size = createVar();
const sizeMax = createVar();

export const hero = style({
  containerType: "inline-size",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  padding: 34,
  background: vars.t3,
});

// Off the scale: the name is fitted to the card. "Xpdustry" is ~4.45em wide and the mark ~1.08em,
// plus the gap, so it grows with the card up to a cap that shrinks with the page.
export const brand = style({
  vars: {
    [size]: `min(${fallbackVar(sizeMax, "96px")}, calc((100cqi - 26px) / 5.53))`,
  },
  display: "flex",
  alignItems: "center",
  gap: 18,
  "@media": {
    [media.tablet]: { vars: { [sizeMax]: "72px" } },
    [media.phone]: { vars: { [sizeMax]: "52px" }, gap: 12 },
  },
});

export const mark = style({
  selectors: {
    [`${hero} &`]: { width: `calc(${size} * 1.083)` },
  },
});

globalStyle(`${brand} h1`, {
  fontSize: size,
  lineHeight: leading.tight,
  letterSpacing: tracking.display,
  color: vars.t12,
  textWrap: "balance",
});

globalStyle(`${hero} p`, {
  maxWidth: "38ch",
  marginTop: 22,
  fontSize: font.lead,
  lineHeight: leading.text,
  color: vars.t12,
  opacity: 0.85,
});

export const actions = style({
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 26,
});
