/**
 * Settings for the reticulate texture, the labyrinth pattern of a reticulate whipray, drawn by
 * `lib/reticulate`. `blobs` fuse the labyrinth into solid patches that fray at their edges; a
 * `ramp` (or a `fit` to the card's title) grows it from a clear top into a solid bottom.
 */
export interface TextureSettings {
  /** The labyrinth's tone, and the solid core's. */
  color: string;
  /** A second tone the labyrinth keeps inside solid cores. */
  inner?: string;
  /** `[x, y, radius, weight]`, in card units; the radius is relative to the card's height. */
  blobs?: readonly (readonly [number, number, number, number])[];
  /** `[from, to]`: the texture grows from nothing at `from` to solid at `to`, in card heights. */
  ramp?: readonly [number, number];
  /** `[gap, fade]` in px: the ramp turns solid `gap` px above the card's title, fading in over `fade`. */
  fit?: readonly [number, number];
  /** `[amplitude, periods, phase]` bends the ramp's edge into one smooth wave. */
  wave?: readonly [number, number, number];
  /** Scattered cells across the whole area, for the page background. */
  noise?: { scale: number; amp: number; bias: number; seed?: number };
  /** Size of one labyrinth tile, in px. */
  tile?: number;
  /** Edge sharpness of the blobs. */
  hard?: number;
  /** How lumpy the outlines are. */
  warp?: number;
  /** How far the fraying reaches out of a blob. */
  reach?: number;
  /** Width of the anti-aliased edge. */
  soft?: number;
  /** Render one seamless square tile of this size instead of fitting the element. */
  repeat?: number;
}

const BASE = { tile: 280, hard: 6 } as const;

/** A card's backdrop: a few lumpy patches of texture. */
export function patches(
  color: string,
  inner: string,
  blobs: NonNullable<TextureSettings["blobs"]>,
  tile: number = BASE.tile,
): TextureSettings {
  return { ...BASE, tile, color, inner, blobs };
}

/**
 * A photo's fade into the card: the texture rises from the bottom in a gentle wave and turns solid
 * just above the title, however tall the title wraps.
 */
export function wave(
  fit: NonNullable<TextureSettings["fit"]>,
  shape: NonNullable<TextureSettings["wave"]>,
): TextureSettings {
  return {
    ...BASE,
    tile: 240,
    warp: 0.3,
    reach: 0.6,
    soft: 0.05,
    color: "#f7fdfd",
    inner: "#eef7f6",
    fit,
    wave: shape,
  };
}
