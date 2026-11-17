import {
  SPREAD_MASKS,
  seamlessStrip,
  type FieldBlob,
  type Px,
  type TextureSettings
} from "./texture.ts";

const DEEP = "#083230";

const PAGE = { tile: 300 } as const;

export const BACKDROP = {
  far: {
    ...PAGE,
    repeat: 900,
    color: "#0f4c48",
    inner: "#11524e",
    scatter: { cells: 3, gain: 6, threshold: 0.52, seed: 3 }
  },
  near: {
    ...PAGE,
    repeat: 900,
    color: "#1b6a65",
    inner: "#18625d",
    scatter: { cells: 4, gain: 6, threshold: 0.5 }
  }
} as const satisfies Record<string, TextureSettings>;

const strip = (width: Px, height: Px, blobs: readonly FieldBlob[], ramp: TextureSettings["ramp"]) =>
  seamlessStrip(width, height, { ...PAGE, color: DEEP, blobs, ramp });

export const CROWN = strip(
  1800,
  280,
  [
    [0.02, 0.44, 0.34],
    [0.13, 0.52, 0.24],
    [0.25, 0.47, 0.3],
    [0.38, 0.55, 0.22],
    [0.5, 0.45, 0.33],
    [0.62, 0.53, 0.26],
    [0.75, 0.46, 0.31],
    [0.87, 0.54, 0.23]
  ],
  { clearAt: 0.72, solidAt: 0.4 }
);

export const RIDGE = strip(
  900,
  160,
  [
    [0.04, 1.12, 0.95],
    [0.23, 1.38, 0.72],
    [0.44, 1.22, 0.82],
    [0.64, 1.42, 0.66],
    [0.83, 1.18, 0.9]
  ],
  { clearAt: 0.45, solidAt: 1.6 }
);

export const FADE = { ...SPREAD_MASKS.core, color: "#f7fdfd", inner: "#eef7f6" };

export const THREADS = SPREAD_MASKS.thin;

const FRINGE_TILE = 108;
const FRINGE_TILES_ACROSS = 6;

const fringe = (solidAlong: "top" | "bottom") =>
  seamlessStrip(FRINGE_TILE * FRINGE_TILES_ACROSS, 64, {
    tile: FRINGE_TILE,
    color: "#000000",
    lumps: { depth: 1, size: 90 },
    ramp: solidAlong === "top" ? { clearAt: 0.8, solidAt: 0.3 } : { clearAt: 0.2, solidAt: 0.7 }
  });

export const FRINGE = fringe("top");
export const RISE = fringe("bottom");
