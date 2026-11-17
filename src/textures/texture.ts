export type Px = number;
export type CardWidths = number;
export type CardHeights = number;

export type FieldBlob = readonly [x: CardWidths, y: CardHeights, radius: CardHeights];

export interface TextureSettings {
  color: string;
  inner?: string;
  tile: Px;
  blobs?: readonly FieldBlob[];
  ramp?: { clearAt: CardHeights; solidAt: CardHeights };
  baseStrength?: number;
  scatter?: { cells: number; threshold: number; gain: number; seed?: number };
  lumps?: { depth?: number; size?: Px; seed?: number };
  fray?: number;
  softEdge?: number;
  repeat?: Px;
  seamless?: boolean;
}

export const DEFAULT_SOFT_EDGE = 0.07;

export interface Painting {
  settings: TextureSettings;
  width: Px;
  height: Px;
}

export function seamlessStrip(width: Px, height: Px, settings: TextureSettings): Painting {
  if (width % settings.tile !== 0) {
    throw new Error(
      `a seamless strip ${width} px wide cuts its ${settings.tile} px labyrinth tile`
    );
  }
  return { width, height, settings: { ...settings, seamless: true } };
}

const BASE = { tile: 280 } as const;

export interface Turn {
  quarters: 0 | 1 | 2 | 3;
  mirrored: boolean;
}

export type Blob = readonly [x: CardWidths, y: CardHeights, radius: Px, turn?: Turn];

const SHAPE_SEEDS = { 1: 23, 2: 37, 3: 52, 4: 68, 5: 91 } as const;
export type Shape = 0 | keyof typeof SHAPE_SEEDS;

export interface Patches {
  color: string;
  inner: string;
  tile: Px;
  blobs: readonly Blob[];
  grow?: number;
  shape?: Shape;
}

export function patches(
  color: string,
  inner: string,
  blobs: readonly Blob[],
  tile: Px = BASE.tile
): Patches {
  return { color, inner, tile, blobs };
}

export function growing(patches: Patches, grow = 1.35): Patches {
  return { ...patches, grow };
}

export function shaped(patches: Patches, shape: Shape): Patches {
  return { ...patches, shape };
}

export function seeded(patches: Patches, name: string, nudge: CardWidths = 0.05): Patches {
  const random = generator(name);
  return {
    ...patches,
    blobs: patches.blobs.map(([x, y, radius]) => {
      const nudged = [x + (random() * 2 - 1) * nudge, y + (random() * 2 - 1) * nudge] as const;
      const turn = Math.floor(random() * 8);
      return [...nudged, radius, { quarters: (turn % 4) as Turn["quarters"], mirrored: turn >= 4 }];
    })
  };
}

function generator(name: string) {
  let seed = 0x811c9dc5;
  for (const char of name) seed = Math.imul(seed ^ char.codePointAt(0)!, 0x01000193);
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SPRITE_SIDE_PER_RADIUS = 3.2;
const RESTING = "_0";
export const GROWN = "_1";

export function blobSprite(
  { color, inner, tile, grow, shape = 0 }: Patches,
  radius: Px,
  grown = false
) {
  const size = Math.ceil(radius * (grow ?? 1) * SPRITE_SIDE_PER_RADIUS);
  const palette = `${color.slice(1)}_${inner.slice(1)}`;
  return {
    key: `blob_${palette}_${tile}_${radius}_${shape}_${Math.round((grow ?? 0) * 100)}${grown ? GROWN : RESTING}`,
    size,
    settings: {
      ...BASE,
      tile,
      color,
      inner,
      ...(shape && { lumps: { seed: SHAPE_SEEDS[shape] } }),
      blobs: [[0.5, 0.5, (grown && grow ? radius * grow : radius) / size]]
    } satisfies TextureSettings
  };
}

export function blobSpriteOf(key: string) {
  const [, color, inner, tile, radius, shape, grow, grown] = key.split("_");
  return blobSprite(
    {
      color: `#${color}`,
      inner: `#${inner}`,
      tile: Number(tile),
      blobs: [],
      shape: Number(shape) as Shape,
      ...(Number(grow) && { grow: Number(grow) / 100 })
    },
    Number(radius),
    `_${grown}` === GROWN
  );
}

export function spreadPalette(color: string, inner: string) {
  return { color, inner };
}

export type SpreadPalette = ReturnType<typeof spreadPalette>;

export const SPREAD_MASK_TILE: Px = 240;

const SPREAD_BASE = {
  repeat: SPREAD_MASK_TILE,
  tile: 240,
  lumps: { depth: 0 },
  color: "#000000"
};

export const SPREAD_MASKS = {
  thin: { ...SPREAD_BASE, baseStrength: 0.3 },
  thick: { ...SPREAD_BASE, baseStrength: 0.4 },
  core: { ...SPREAD_BASE, fray: 0, color: "#ffffff00", inner: "#ffffff", baseStrength: 1 }
} satisfies Record<string, TextureSettings>;
