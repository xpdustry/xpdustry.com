import { createGlobalVar, createVar, fallbackVar, globalStyle, style } from "@vanilla-extract/css";
import { media } from "#app/ui/styles/media";
import { vars } from "#app/ui/styles/theme.css";

/** Each stage's tile, as a `url()`. */
export const tile = { thin: createVar(), thick: createVar(), solid: createVar() };
/** Where the spread starts, from the top left corner. */
export const x = createVar();
export const y = createVar();
/** How far the farthest corner is from where it starts. */
export const reach = createVar();

const SPREAD = "--spread";
const spreadVar = createGlobalVar(SPREAD, {
  syntax: "<length>",
  inherits: true,
  initialValue: "0px"
});

const at = createVar();

export const spread = style({
  vars: { [at]: `circle at ${fallbackVar(x, "50%")} ${fallbackVar(y, "50%")}` },
  position: "absolute",
  inset: 0,
  zIndex: -2,
  opacity: 0,
  pointerEvents: "none",
  transition: `opacity 0.55s ${vars.easeOut}, ${SPREAD} 0s 0.55s`
});

globalStyle(`${spread} > i, ${spread}::before, ${spread}::after`, {
  content: '""',
  position: "absolute",
  inset: 0
});

const layer = (stage: keyof typeof tile, solidTo: string, clearFrom: string) => ({
  background: `${tile[stage]} 0 0 / 240px`,
  mask: `radial-gradient(${at}, #000 ${solidTo}, transparent ${clearFrom})`
});

globalStyle(
  `${spread} > i`,
  layer("solid", `calc(${spreadVar} - 110px)`, `calc(${spreadVar} - 92px)`)
);
globalStyle(
  `${spread}::before`,
  layer("thick", `calc(${spreadVar} - 52px)`, `calc(${spreadVar} - 38px)`)
);
globalStyle(`${spread}::after`, layer("thin", `calc(${spreadVar} - 10px)`, spreadVar));

export const on = style({
  vars: { [spreadVar]: `calc(${fallbackVar(reach, "700px")} + 120px)` },
  opacity: 1,
  transition: `${SPREAD} 0.9s ${vars.easeGrow}, opacity 0.1s`
});

globalStyle(`${spread}, ${on}`, {
  "@media": {
    [media.still]: {
      vars: { [spreadVar]: "4000px" },
      transition: "opacity 0.15s"
    }
  }
});
