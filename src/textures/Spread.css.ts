import {
  createGlobalVar,
  createVar,
  fallbackVar,
  globalStyle,
  keyframes,
  style
} from "@vanilla-extract/css";
import { media } from "#app/ui/styles/media";
import { vars } from "#app/ui/styles/theme.css";

export const color = createVar();
export const inner = createVar();
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

/** Out from nothing to the spread's resting reach, so every play starts over from the press. */
const grow = keyframes({ from: { vars: { [spreadVar]: "0px" } } });

/**
 * At rest it already reaches past the farthest corner, so it fades out whole once `on` is over,
 * and `on` only has to play `grow`: an animation starts over each time it is applied, where a
 * transition would carry on from wherever the last one left off and only fade the colour back in.
 */
export const spread = style({
  vars: {
    [at]: `circle at ${fallbackVar(x, "50%")} ${fallbackVar(y, "50%")}`,
    [spreadVar]: `calc(${fallbackVar(reach, "700px")} + 120px)`
  },
  position: "absolute",
  inset: 0,
  zIndex: -2,
  opacity: 0,
  pointerEvents: "none",
  transition: `opacity 0.55s ${vars.easeOut}`
});

globalStyle(`${spread} > i, ${spread}::before, ${spread}::after`, {
  content: '""',
  position: "absolute",
  inset: 0
});

const layer = (image: string, solidTo: string, clearFrom: string) => ({
  background: color,
  maskImage: `url("${image}"), radial-gradient(${at}, #000 ${solidTo}, transparent ${clearFrom})`,
  maskComposite: "intersect",
  maskSize: "240px, auto",
  maskRepeat: "repeat, no-repeat"
});

export const ready = style({});

globalStyle(`${ready} > i`, {
  background: color,
  mask: `radial-gradient(${at}, #000 calc(${spreadVar} - 110px), transparent calc(${spreadVar} - 92px))`
});
globalStyle(`${ready} > i::before`, {
  content: '""',
  position: "absolute",
  inset: 0,
  background: inner,
  mask: 'url("./assets/spread/core.webp") 0 0 / 240px repeat'
});
globalStyle(
  `${ready}::before`,
  layer("./assets/spread/thick.webp", `calc(${spreadVar} - 52px)`, `calc(${spreadVar} - 38px)`)
);
globalStyle(
  `${ready}::after`,
  layer("./assets/threads.webp", `calc(${spreadVar} - 10px)`, spreadVar)
);

export const on = style({
  opacity: 1,
  transition: "opacity 0.1s",
  animation: `${grow} 0.9s ${vars.easeGrow}`
});

/** A play a newer one covers: it keeps `on`'s growth going, if it had it, as it fades out. */
export const gone = style({
  opacity: 0,
  transition: `opacity 0.55s ${vars.easeOut}`
});

globalStyle(`${spread}, ${on}`, {
  "@media": {
    [media.still]: {
      vars: { [spreadVar]: "4000px" },
      transition: "opacity 0.15s",
      animation: "none"
    }
  }
});
