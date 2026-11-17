import { BACKDROP, CROWN, FADE, FRINGE, RIDGE, RISE, THREADS } from "./page.ts";
import {
  DEFAULT_SOFT_EDGE,
  SPREAD_MASKS,
  blobSpriteOf,
  type Painting,
  type TextureSettings
} from "./texture.ts";

const BACKDROP_DENSITY = 0.5;
const BLOB_DENSITY = 0.75;

const NAMED_IN_PAINT_ORDER = {
  crown: atDensity(CROWN),
  "backdrop-far": atDensity({ settings: BACKDROP.far }, BACKDROP_DENSITY),
  "backdrop-near": atDensity({ settings: BACKDROP.near }, BACKDROP_DENSITY),
  threads: atDensity({ settings: THREADS }),
  ridge: atDensity(RIDGE),
  fade: atDensity({ settings: FADE }),
  rise: atDensity(RISE),
  fringe: atDensity(FRINGE),
  "spread-thick": atDensity({ settings: SPREAD_MASKS.thick }),
  "spread-core": atDensity({ settings: SPREAD_MASKS.core })
} satisfies Record<string, Painting>;

export type PaintName = keyof typeof NAMED_IN_PAINT_ORDER;

export const PAINT_NAMES = Object.keys(NAMED_IN_PAINT_ORDER) as PaintName[];

export const FRAME_PAINTS: PaintName[] = ["crown", "backdrop-far", "backdrop-near", "threads"];

const CLEAR_IMAGE = "linear-gradient(#0000 0 0)";

export const paint = (name: PaintName) => `var(--paint-${name}, ${CLEAR_IMAGE})`;

function atDensity(
  {
    settings,
    width = 0,
    height = 0
  }: { settings: TextureSettings; width?: number; height?: number },
  density = 1
): Painting {
  const { tile, repeat, lumps, softEdge = DEFAULT_SOFT_EDGE } = settings;
  return {
    settings: {
      ...settings,
      tile: tile * density,
      ...(repeat && { repeat: repeat * density }),
      ...(lumps?.size && { lumps: { ...lumps, size: lumps.size * density } }),
      softEdge: softEdge / density
    },
    width: Math.round(width * density),
    height: Math.round(height * density)
  };
}

export function painting(key: string): Painting {
  if (key in NAMED_IN_PAINT_ORDER) return NAMED_IN_PAINT_ORDER[key as PaintName];
  const { settings, size } = blobSpriteOf(key);
  return atDensity({ settings, width: size, height: size }, BLOB_DENSITY);
}
