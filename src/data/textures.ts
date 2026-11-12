import { spreadTiles, type TextureSettings } from "../lib/textures.ts";

const DEEP = "#083230";

const PAGE = { tile: 300, hard: 6 } as const;

export const BACKDROP = {
  far: {
    ...PAGE,
    repeat: 900,
    color: "#0f4c48",
    inner: "#11524e",
    noise: { scale: 3, amp: 6, bias: 0.52, seed: 3 },
  },
  near: {
    ...PAGE,
    repeat: 900,
    color: "#1b6a65",
    inner: "#18625d",
    noise: { scale: 4, amp: 6, bias: 0.5 },
  },
} as const satisfies Record<string, TextureSettings>;

function strip(
  width: number,
  height: number,
  blobs: NonNullable<TextureSettings["blobs"]>,
  ramp: readonly [number, number],
) {
  return {
    width,
    height,
    settings: { ...PAGE, color: DEEP, seamless: true, blobs, span: width / height, ramp },
  } as const satisfies { width: number; height: number; settings: TextureSettings };
}

export const CROWN = strip(
  1800,
  280,
  [
    [0.02, 0.44, 0.34, 1],
    [0.13, 0.52, 0.24, 1],
    [0.25, 0.47, 0.3, 1],
    [0.38, 0.55, 0.22, 1],
    [0.5, 0.45, 0.33, 1],
    [0.62, 0.53, 0.26, 1],
    [0.75, 0.46, 0.31, 1],
    [0.87, 0.54, 0.23, 1],
  ],
  [0.72, 0.4],
);

export const RIDGE = strip(
  900,
  160,
  [
    [0.04, 1.12, 0.95, 1],
    [0.23, 1.38, 0.72, 1],
    [0.44, 1.22, 0.82, 1],
    [0.64, 1.42, 0.66, 1],
    [0.83, 1.18, 0.9, 1],
  ],
  [0.45, 1.6],
);

export const FADE = spreadTiles("#f7fdfd", "#eef7f6").solid.settings;
