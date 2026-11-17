import { createGlobalVar, globalStyle, style } from "@vanilla-extract/css";
import { media } from "#app/ui/styles/media";
import { cover } from "#app/ui/Card.css";
import { vars } from "#app/ui/styles/theme.css";

const GROW = "--grow";
const grow = createGlobalVar(GROW, {
  syntax: "<number>",
  inherits: true,
  initialValue: "0.45"
});

const opened = createGlobalVar("--opened", {
  syntax: "<number>",
  inherits: false,
  initialValue: "1"
});
const openness = `${grow} * ${opened}`;

export const patches = style({});

globalStyle(`:where(${patches})`, {
  position: "absolute",
  inset: 0,
  zIndex: -1,
  overflow: "hidden",
  borderRadius: "inherit",
  pointerEvents: "none"
});

export const placement = style({
  position: "absolute",
  translate: "-50% -50%",
  contentVisibility: "auto"
});

export const sprite = style({
  position: "absolute",
  inset: 0,
  background: "var(--paint) 0 0 / 100% 100% no-repeat"
});

const fullGrowth = {
  vars: { [grow]: "1" },
  transition: `${GROW} 1.2s ${vars.easeGrow}`
};

export const grown = style({
  mask: `radial-gradient(closest-side, #000 calc(${openness} * 100% - 6%), transparent calc(${openness} * 100%))`,
  transition: `${GROW} 0.6s ease-in-out`,
  selectors: {
    [`:is(a, button):focus-visible &, ${cover}:focus-visible ~ ${patches} &`]: fullGrowth
  },
  "@media": {
    [media.hover]: {
      selectors: { [`:is(a, button):hover &, ${cover}:hover ~ ${patches} &`]: fullGrowth }
    }
  }
});
