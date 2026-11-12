import { createGlobalVar, globalStyle, style } from "@vanilla-extract/css";
import { cover } from "#app/ui/Card.css";
import { vars } from "#app/ui/styles/theme.css";

const GROW = "--grow";
const grow = createGlobalVar(GROW, {
  syntax: "<number>",
  inherits: true,
  initialValue: "0.45"
});

export const patches = style({});

globalStyle(`:where(${patches})`, {
  position: "absolute",
  inset: 0,
  zIndex: -1,
  overflow: "hidden",
  borderRadius: "inherit",
  pointerEvents: "none"
});

globalStyle(`${patches} img`, {
  position: "absolute",
  maxWidth: "none",
  translate: "-50% -50%"
});

export const grown = style({
  mask: `radial-gradient(closest-side, #000 calc(${grow} * 100% - 6%), transparent calc(${grow} * 100%))`,
  transition: `${GROW} 0.6s ease-in-out`,
  selectors: {
    [`:is(a, button):is(:hover, :focus-visible) &, ${cover}:is(:hover, :focus-visible) ~ ${patches} &`]:
      {
        vars: { [grow]: "1" },
        transition: `${GROW} 1.2s ${vars.easeGrow}`
      }
  }
});
