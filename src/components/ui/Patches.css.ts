import { createGlobalVar, globalStyle, style } from "@vanilla-extract/css";
import { vars } from "#app/styles/theme.css";

/**
 * How far out from the blob's middle its grown sprite shows, as a share of the sprite; it starts
 * at the resting blob's edge. A literal name: a card's own styles grow it under the pointer.
 */
const GROW = "--grow";
const grow = createGlobalVar(GROW, {
  syntax: "<number>",
  inherits: true,
  initialValue: "0.45",
});

/** Zero specificity, so a `className` can place the patches anywhere. */
export const patches = style({});

globalStyle(`:where(${patches})`, {
  position: "absolute",
  inset: 0,
  zIndex: -1,
  overflow: "hidden",
  borderRadius: "inherit",
  pointerEvents: "none",
});

globalStyle(`${patches} img`, {
  position: "absolute",
  maxWidth: "none",
  translate: "-50% -50%",
});

export const grown = style({
  mask: `radial-gradient(closest-side, #000 calc(${grow} * 100% - 6%), transparent calc(${grow} * 100%))`,
  transition: `${GROW} 0.6s ease-in-out`,
  selectors: {
    // a card that is a link or a button grows its patches while hovered or focused
    ":is(a, button):is(:hover, :focus-visible) &": {
      vars: { [grow]: "1" },
      transition: `${GROW} 1.2s ${vars.easeGrow}`,
    },
  },
});
