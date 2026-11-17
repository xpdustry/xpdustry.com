import {
  createGlobalVar,
  createVar,
  fallbackVar,
  globalStyle,
  keyframes,
  style
} from "@vanilla-extract/css";
import { media } from "#app/ui/styles/media";
import { paint, type PaintName } from "./catalogue";
import { vars } from "#app/ui/styles/theme.css";

export const color = createVar();
export const inner = createVar();
/** Where the spread starts, from the top left corner. */
export const x = createVar();
export const y = createVar();
/** How far the farthest corner is from where it starts. */
export const reach = createVar();

/** How far behind the front each layer ends, in px: `[solid up to, clear from]`. */
const THIN = [10, 0] as const;
const THICK = [52, 38] as const;
const SOLID = [110, 92] as const;

/** The radius of the front. */
const SPREAD = "--spread";
const spreadVar = createGlobalVar(SPREAD, {
  syntax: "<length>",
  inherits: true,
  initialValue: "0px"
});

/**
 * The radius of the clear hole in the middle of a wave, whose edge frays like the front does, in
 * the opposite order. A fill has no hole.
 */
const HOLE = "--spread-hole";
const holeVar = createGlobalVar(HOLE, {
  syntax: "<length>",
  inherits: true,
  initialValue: "0px"
});

const at = createVar();
/** A front that has closed over the farthest corner. */
const rest = `calc(${fallbackVar(reach, "700px")} + 120px)`;

/** Out from nothing to the spread's resting reach, so every play starts over from the press. */
const grow = keyframes({ from: { vars: { [spreadVar]: "0px" } } });

/** How long a spread takes to dissolve once `on` is over, in ms: the delays of its layers below. */
const DISSOLVE = 800;

/**
 * At rest it already reaches past the farthest corner, so it dissolves whole once `on` is over,
 * and `on` only has to play `grow`: an animation starts over each time it is applied, where a
 * transition would carry on from wherever the last one left off and only fade the colour back in.
 * It stays opaque until its layers have dissolved, each in its turn.
 */
export const spread = style({
  vars: {
    [at]: `circle at ${fallbackVar(x, "50%")} ${fallbackVar(y, "50%")}`,
    [spreadVar]: rest
  },
  position: "absolute",
  inset: 0,
  zIndex: -2,
  opacity: 0,
  pointerEvents: "none",
  transition: `opacity 0s linear ${DISSOLVE}ms`
});

globalStyle(`${spread} > i, ${spread}::before, ${spread}::after`, {
  content: '""',
  position: "absolute",
  inset: 0
});

/** Everything out to the front. */
const front = ([solidTo, clearFrom]: readonly [number, number]) =>
  `radial-gradient(${at}, #000 calc(${spreadVar} - ${solidTo}px), transparent calc(${spreadVar} - ${clearFrom}px))`;
/** Everything past the hole. */
const hole = ([solidFrom, clearTo]: readonly [number, number]) =>
  `radial-gradient(${at}, transparent calc(${holeVar} + ${clearTo}px), #000 calc(${holeVar} + ${solidFrom}px))`;

const layer = (image: PaintName, edge: readonly [number, number]) => ({
  background: color,
  maskImage: `${paint(image)}, ${front(edge)}`,
  maskComposite: "intersect",
  maskSize: "240px, auto",
  maskRepeat: "repeat, no-repeat"
});
/** The same layer with a wave's hole cut out of it. */
const holed = (image: PaintName, edge: readonly [number, number]) => ({
  maskImage: `${paint(image)}, ${front(edge)}, ${hole(edge)}`,
  maskSize: "240px, auto, auto",
  maskRepeat: "repeat, no-repeat, no-repeat"
});

export const ready = style({});

globalStyle(`${ready} > i`, {
  background: color,
  mask: front(SOLID)
});
globalStyle(`${ready} > i::before`, {
  content: '""',
  position: "absolute",
  inset: 0,
  background: inner,
  mask: `${paint("spread-core")} 0 0 / 240px repeat`
});
globalStyle(`${ready}::before`, layer("spread-thick", THICK));
globalStyle(`${ready}::after`, layer("threads", THIN));

export const on = style({
  opacity: 1,
  transition: "opacity 0.1s",
  animation: `${grow} 0.9s ${vars.easeGrow}`
});

/**
 * Once `on` is over the spread dissolves the way it fused, backwards and all over at once: the
 * solid goes first, which leaves the thick threads, then those, which leaves the thin ones.
 */
const dissolving = (delay: number) => ({
  "@media": { [media.motion]: { opacity: 0, transition: `opacity 0.3s ease-in ${delay}ms` } }
});
globalStyle(`${spread} > i`, dissolving(0));
globalStyle(`${spread}::before`, dissolving(200));
globalStyle(`${spread}::after`, dissolving(DISSOLVE - 350));
globalStyle(`${on} > i, ${on}::before, ${on}::after`, {
  "@media": { [media.motion]: { opacity: 1, transition: "none" } }
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

/** How wide a wave is, in px, from its front to the far edge of its hole. */
const BAND = 240;
const sweep = keyframes({
  from: { vars: { [spreadVar]: "0px", [holeVar]: `${-BAND}px` } }
});

/**
 * A spread that passes instead of filling: a band of the reticulate out from the press and off
 * the card, which it leaves as it was. At rest the band is past the farthest corner, so a wave
 * needs no end to its `on`. It is all motion, so a visitor who wants less of it gets none.
 */
export const wave = style({
  vars: { [spreadVar]: `calc(${rest} + ${BAND}px)`, [holeVar]: rest },
  selectors: {
    [`&${on}`]: {
      "@media": {
        [media.motion]: { animation: `${sweep} 1.3s cubic-bezier(0.3, 0.4, 0.5, 1)` }
      }
    }
  }
});

globalStyle(`${wave}${ready} > i`, {
  maskImage: `${front(SOLID)}, ${hole(SOLID)}`,
  maskComposite: "intersect"
});
globalStyle(`${wave}${ready}::before`, holed("spread-thick", THICK));
globalStyle(`${wave}${ready}::after`, holed("threads", THIN));
