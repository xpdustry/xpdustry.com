import { BACKDROP, CROWN, FADE, FRINGE, RIDGE, RISE, THREADS } from "./page.ts";
import { SPREAD_MASKS, blobSpriteOf, type TextureSettings } from "./texture.ts";

/** What the painter paints: a texture's settings at its size, in px of the painted image. */
export interface Painting {
  settings: TextureSettings;
  width: number;
  height: number;
}

/**
 * The share of a texture's CSS px it is painted at. A phone paints every px itself, so the layers
 * that only sit behind the page take fewer: they are large, soft and far from the eye.
 */
const BACKDROP_DENSITY = 0.5;
const BLOB_DENSITY = 0.75;

/**
 * The textures the page's styles name, as `var(--paint-<name>)`, in the order they are painted.
 */
const NAMED = {
  crown: at(CROWN),
  "backdrop-far": at({ settings: BACKDROP.far }, BACKDROP_DENSITY),
  "backdrop-near": at({ settings: BACKDROP.near }, BACKDROP_DENSITY),
  threads: at({ settings: THREADS }),
  ridge: at(RIDGE),
  fade: at({ settings: FADE }),
  rise: at(RISE),
  fringe: at(FRINGE),
  "spread-thick": at({ settings: SPREAD_MASKS.thick }),
  "spread-core": at({ settings: SPREAD_MASKS.solid })
} satisfies Record<string, Painting>;

export type PaintName = keyof typeof NAMED;

export const PAINT_NAMES = Object.keys(NAMED) as PaintName[];

/** What frames the first screen, behind every card: painted before anything else. */
export const FRAME_PAINTS: PaintName[] = ["crown", "backdrop-far", "backdrop-near", "threads"];

/**
 * A named texture in a style. Until the painter has painted it, it is a clear image: a background
 * shows nothing, and a mask hides what it would have shaped instead of leaving it a plain box.
 */
export const paint = (name: PaintName) => `var(--paint-${name}, linear-gradient(#0000 0 0))`;

/**
 * The same texture at a density: its lengths in px shrink with it, so it is painted directly at
 * the size it is shown instead of being painted large and scaled down.
 */
function at(
  {
    settings,
    width = 0,
    height = 0
  }: { settings: TextureSettings; width?: number; height?: number },
  density = 1
): Painting {
  const { tile = 300, repeat, lumps } = settings;
  return {
    settings: {
      ...settings,
      tile: tile * density,
      ...(repeat && { repeat: repeat * density }),
      ...(lumps && { lumps: lumps * density }),
      // The threshold's soft edge is in labyrinth values, which change faster per px when shrunk.
      soft: (settings.soft ?? 0.07) / density
    },
    width: Math.round(width * density),
    height: Math.round(height * density)
  };
}

/** What a key paints: a named texture, or the blob sprite the key describes. */
export function painting(key: string): Painting {
  if (key in NAMED) return NAMED[key as PaintName];
  const { settings, size } = blobSpriteOf(key);
  return at({ settings, width: size, height: size }, BLOB_DENSITY);
}
