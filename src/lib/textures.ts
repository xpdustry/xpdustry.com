/**
 * Settings for the reticulate texture, the labyrinth pattern of a reticulate whipray. `blobs`
 * fuse the labyrinth into solid patches that fray at their edges; a `ramp` grows it from a clear
 * top into a solid bottom.
 */
export interface TextureSettings {
  /** The labyrinth's tone, and the solid core's. */
  color: string;
  /** A second tone the labyrinth keeps inside solid cores. */
  inner?: string;
  /** `[x, y, radius, weight]`, in card units; the radius is relative to the card's height. */
  blobs?: readonly (readonly [number, number, number, number])[];
  /**
   * Repeat the blobs side by side every `span` card heights, their `x` now in spans, so a wider
   * element gets more of them instead of stretched-apart ones.
   */
  span?: number;
  /** `[from, to]`: the texture grows from nothing at `from` to solid at `to`, in card heights. */
  ramp?: readonly [number, number];
  /** The field's strength all over: 0 leaves only what blobs, ramp and noise add, 1 is solid. */
  level?: number;
  /** Scattered cells across the whole area, for the page background. */
  noise?: { scale: number; amp: number; bias: number; seed?: number };
  /** Size of one labyrinth tile, in px. */
  tile?: number;
  /** Edge sharpness of the blobs. */
  hard?: number;
  /** How lumpy the outlines are. */
  warp?: number;
  /** Which lumps they are: another seed, another outline. */
  seed?: number;
  /**
   * The px size the lumps are measured against, so a large render's blobs are as lumpy as a
   * sprite's. By default, the render's height.
   */
  lumps?: number;
  /** How far the fraying reaches out of a blob. */
  reach?: number;
  /** Width of the anti-aliased edge. */
  soft?: number;
  /** Render one seamless square tile of this size instead of fitting the element. */
  repeat?: number;
  /**
   * Wrap side to side, so copies in a row meet without a seam. The width must hold a whole
   * number of labyrinth tiles, and of `span`s.
   */
  seamless?: boolean;
}

const BASE = { tile: 280, hard: 6 } as const;

const SHAPE_SEEDS = [23, 37, 52, 68, 91] as const;

/**
 * A patch of labyrinth on a card: its centre in card units, its radius in px, and how its sprite
 * is turned, `0..7`: a quarter turn per step, mirrored from 4 on.
 */
export type Blob = readonly [x: number, y: number, radius: number, turn?: number];

export interface Patches {
  color: string;
  inner: string;
  tile: number;
  blobs: readonly Blob[];
  /** How much bigger the blobs grow while the card is hovered or focused, if they do. */
  grow?: number;
  /** Which outline the blobs take, of as many as are asked for; the usual one by default. */
  shape?: number;
}

export function patches(
  color: string,
  inner: string,
  blobs: readonly Blob[],
  tile: number = BASE.tile,
): Patches {
  return { color, inner, tile, blobs };
}

/** The same patches, growing by `grow` under the pointer: for cards that are links. */
export function growing(patches: Patches, grow = 1.35): Patches {
  return { ...patches, grow };
}

/**
 * The same patches with another outline, so patches that sit side by side are not copies of each
 * other. Each shape of a blob is a sprite of its own.
 */
export function shaped(patches: Patches, shape: number): Patches {
  return { ...patches, shape };
}

/**
 * The patches nudged and turned by a hash of `name`, so each post or project gets its own and
 * always the same one. A turn reuses the blob's sprite, so it costs no new sprite.
 */
export function seeded(patches: Patches, name: string, nudge = 0.05): Patches {
  const random = generator(name);
  return {
    ...patches,
    blobs: patches.blobs.map(([x, y, radius]) => [
      x + (random() * 2 - 1) * nudge,
      y + (random() * 2 - 1) * nudge,
      radius,
      Math.floor(random() * 8),
    ]),
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

/**
 * The sprite of one blob: a square around it, roomy enough for its lumps and fraying, its name
 * and the settings that render it. Blobs of one size, palette and shape share a sprite.
 *
 * A growing blob's sprite and its `grown` one are the same size, so their labyrinth and lumps
 * line up exactly and the bigger one only fuses more of it.
 */
export function blobSprite(
  { color, inner, tile, grow, shape = 0 }: Patches,
  radius: number,
  grown = false,
) {
  const size = Math.ceil(radius * (grow ?? 1) * 3.2);
  const name = `${color.slice(1)}-${inner.slice(1)}-${tile}-${radius}${shape ? `s${shape}` : ""}`;
  return {
    name: grow ? `${name}x${grow}${grown ? "-grown" : ""}` : name,
    size,
    settings: {
      ...BASE,
      tile,
      color,
      inner,
      ...(shape && { seed: SHAPE_SEEDS[shape - 1]! }),
      blobs: [[0.5, 0.5, (grown && grow ? radius * grow : radius) / size, 1]],
    } satisfies TextureSettings,
  };
}

/** Every sprite the patches paint with, the grown ones included. */
export function blobSprites(patches: Patches) {
  return patches.blobs.flatMap(([, , radius]) =>
    patches.grow
      ? [blobSprite(patches, radius), blobSprite(patches, radius, true)]
      : [blobSprite(patches, radius)],
  );
}

export type SpreadStage = "thin" | "thick" | "solid";

export function spreadTiles(color: string, inner: string) {
  const base = { ...BASE, repeat: 240, tile: 240, warp: 0, color } as const;
  const palette = `${color.slice(1)}-${inner.slice(1)}`;
  return {
    thin: { name: `${palette}-thin`, settings: { ...base, level: 0.3 } },
    thick: { name: `${palette}-thick`, settings: { ...base, level: 0.4 } },
    solid: { name: `${palette}-solid`, settings: { ...base, reach: 0, inner, level: 1 } },
  } as const satisfies Record<SpreadStage, { name: string; settings: TextureSettings }>;
}

export type SpreadTiles = ReturnType<typeof spreadTiles>;

/**
 * A colour's lower edge, frayed and lumpy instead of straight (`Fringe`): one seamless strip,
 * solid along its top, to lay under where the colour ends; or `rising`, solid along its foot, for
 * an upper edge. `pnpm textures` renders it.
 */
const FRINGE_TILE = 108;
const FRINGE_TILES_ACROSS = 6;

export function fringe(color: string, rising = false) {
  return {
    name: `${color.slice(1)}-${rising ? "rise" : "fringe"}`,
    width: FRINGE_TILE * FRINGE_TILES_ACROSS,
    height: 64,
    settings: {
      ...BASE,
      tile: FRINGE_TILE,
      color,
      seamless: true,
      warp: 1,
      lumps: 90,
      ramp: rising ? [0.2, 0.7] : [0.8, 0.3],
    } satisfies TextureSettings,
  } as const;
}

export type Fringe = ReturnType<typeof fringe>;
