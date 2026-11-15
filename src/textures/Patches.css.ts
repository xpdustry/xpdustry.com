import { createGlobalVar, createVar, globalStyle, style } from "@vanilla-extract/css";
import { cover } from "#app/ui/Card.css";
import { vars } from "#app/ui/styles/theme.css";

const GROW = "--grow";
const grow = createGlobalVar(GROW, {
  syntax: "<number>",
  inherits: true,
  initialValue: "0.45"
});

export const patches = style({});
export const color = createVar();
export const inner = createVar();
export const image = createVar();

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

export const sprite = style({ position: "absolute", inset: 0 });
export const raster = style({ display: "block", width: "100%", height: "100%" });

export const paint = style({
  position: "absolute",
  inset: 0,
  background: color,
  mask: `${image} 0 0 / 200% 100% no-repeat`,
  selectors: {
    "&::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      background: inner,
      mask: `${image} 100% 0 / 200% 100% no-repeat`
    }
  }
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
