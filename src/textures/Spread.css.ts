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
import { SPREAD_MASK_TILE, type Px } from "./texture";
import { FACE_INSET } from "#app/ui/Card.css";
import { vars } from "#app/ui/styles/theme.css";

export const color = createVar();
export const inner = createVar();
export const originX = createVar();
export const originY = createVar();
export const reach = createVar();

interface LayerEdge {
  solidBehind: Px;
  clearBehind: Px;
}

const THIN: LayerEdge = { solidBehind: 10, clearBehind: 0 };
const THICK: LayerEdge = { solidBehind: 52, clearBehind: 38 };
const CORE: LayerEdge = { solidBehind: 110, clearBehind: 92 };

const MASK_TILE = `${SPREAD_MASK_TILE}px`;

const FRONT_RADIUS = "--spread";
const frontRadius = createGlobalVar(FRONT_RADIUS, {
  syntax: "<length>",
  inherits: true,
  initialValue: "0px"
});

const HOLE_RADIUS = "--spread-hole";
const holeRadius = createGlobalVar(HOLE_RADIUS, {
  syntax: "<length>",
  inherits: true,
  initialValue: "0px"
});

const at = createVar();
const pastFarthestCorner = `calc(${fallbackVar(reach, "700px")} + 120px)`;

const grow = keyframes({ from: { vars: { [frontRadius]: "0px" } } });

const DISSOLVE_MS = 800;
const DISSOLVE_DELAYS_MS = { core: 0, thick: 200, thin: DISSOLVE_MS - 350 };

export const spread = style({
  vars: {
    [at]: `circle at ${fallbackVar(originX, "50%")} ${fallbackVar(originY, "50%")}`,
    [frontRadius]: pastFarthestCorner
  },
  position: "absolute",
  inset: FACE_INSET,
  zIndex: -2,
  overflow: "hidden",
  borderRadius: "inherit",
  opacity: 0,
  pointerEvents: "none",
  transition: `opacity 0s linear ${DISSOLVE_MS}ms`
});

globalStyle(`${spread} > i, ${spread}::before, ${spread}::after`, {
  content: '""',
  position: "absolute",
  inset: 0
});

const insideFront = ({ solidBehind, clearBehind }: LayerEdge) =>
  `radial-gradient(${at}, #000 calc(${frontRadius} - ${solidBehind}px), transparent calc(${frontRadius} - ${clearBehind}px))`;
const outsideHole = ({ solidBehind, clearBehind }: LayerEdge) =>
  `radial-gradient(${at}, transparent calc(${holeRadius} + ${clearBehind}px), #000 calc(${holeRadius} + ${solidBehind}px))`;

const fillLayer = (image: PaintName, edge: LayerEdge) => ({
  background: color,
  maskImage: `${paint(image)}, ${insideFront(edge)}`,
  maskComposite: "intersect",
  maskSize: `${MASK_TILE}, auto`,
  maskRepeat: "repeat, no-repeat"
});
const waveLayer = (image: PaintName, edge: LayerEdge) => ({
  maskImage: `${paint(image)}, ${insideFront(edge)}, ${outsideHole(edge)}`,
  maskSize: `${MASK_TILE}, auto, auto`,
  maskRepeat: "repeat, no-repeat, no-repeat"
});

export const ready = style({});

globalStyle(`${ready} > i`, {
  background: color,
  mask: insideFront(CORE)
});
globalStyle(`${ready} > i::before`, {
  content: '""',
  position: "absolute",
  inset: 0,
  background: inner,
  mask: `${paint("spread-core")} 0 0 / ${MASK_TILE} repeat`
});
globalStyle(`${ready}::before`, fillLayer("spread-thick", THICK));
globalStyle(`${ready}::after`, fillLayer("threads", THIN));

export const on = style({
  opacity: 1,
  transition: "opacity 0.1s",
  animation: `${grow} 0.9s ${vars.easeGrow}`
});

const dissolving = (delayMs: number) => ({
  "@media": { [media.motion]: { opacity: 0, transition: `opacity 0.3s ease-in ${delayMs}ms` } }
});
globalStyle(`${spread} > i`, dissolving(DISSOLVE_DELAYS_MS.core));
globalStyle(`${spread}::before`, dissolving(DISSOLVE_DELAYS_MS.thick));
globalStyle(`${spread}::after`, dissolving(DISSOLVE_DELAYS_MS.thin));
globalStyle(`${on} > i, ${on}::before, ${on}::after`, {
  "@media": { [media.motion]: { opacity: 1, transition: "none" } }
});

export const covered = style({
  opacity: 0,
  transition: `opacity 0.55s ${vars.easeOut}`
});

globalStyle(`${spread}, ${on}`, {
  "@media": {
    [media.still]: {
      vars: { [frontRadius]: "4000px" }
    }
  }
});

const WAVE_BAND: Px = 240;
const sweep = keyframes({
  from: { vars: { [frontRadius]: "0px", [holeRadius]: `${-WAVE_BAND}px` } }
});

export const wave = style({
  vars: {
    [frontRadius]: `calc(${pastFarthestCorner} + ${WAVE_BAND}px)`,
    [holeRadius]: pastFarthestCorner
  },
  selectors: {
    [`&${on}`]: {
      "@media": {
        [media.motion]: { animation: `${sweep} 1.3s cubic-bezier(0.3, 0.4, 0.5, 1)` }
      }
    }
  }
});

globalStyle(`${wave}${ready} > i`, {
  maskImage: `${insideFront(CORE)}, ${outsideHole(CORE)}`,
  maskComposite: "intersect"
});
globalStyle(`${wave}${ready}::before`, waveLayer("spread-thick", THICK));
globalStyle(`${wave}${ready}::after`, waveLayer("threads", THIN));
