// The reticulate texture's maths. No DOM here: it runs in Node, for `pnpm textures` and the test
// that checks what it rendered.

import type { TextureSettings } from "#app/data/textures";

/** The labyrinth tile, as alpha in 0..1, `size` px square. */
export interface Labyrinth {
  data: Float32Array;
  size: number;
}

/** The labyrinth from its decoded PNG, whose alpha is the pattern: `channels` values per pixel, alpha last. */
export function toLabyrinth(pixels: ArrayLike<number>, channels: number, size: number): Labyrinth {
  let max = 0;
  for (let i = channels - 1; i < pixels.length; i += channels) max = Math.max(max, pixels[i]!);
  const data = new Float32Array(size * size);
  for (let i = 0; i < data.length; i++) data[i] = pixels[i * channels + channels - 1]! / max;
  return { data, size };
}

export type Rgba = readonly [number, number, number, number];

export function parseHex(color: string): Rgba {
  const hex = color.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));
  return [r!, g!, b!, hex.length > 6 ? Number.parseInt(hex.slice(6, 8), 16) : 255];
}

/** Smooth value noise in 0..1, tileable when `period` is set. */
export function makeNoise(seed = 1, period = 0) {
  const hash = (x: number, y: number) => {
    let h = (x * 374761393 + y * 668265263 + seed * 144665) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const wrap = (i: number, p: number) => (p ? ((i % p) + p) % p : i);
  const sample = (x: number, y: number, p: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = smooth(x - xi);
    const yf = smooth(y - yi);
    const x0 = wrap(xi, p);
    const y0 = wrap(yi, p);
    const x1 = wrap(xi + 1, p);
    const y1 = wrap(yi + 1, p);
    const a = hash(x0, y0);
    const b = hash(x1, y0);
    const c = hash(x0, y1);
    const d = hash(x1, y1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
  return (x: number, y: number, octaves = 3) => {
    let sum = 0;
    let amplitude = 0.5;
    let frequency = 1;
    let total = 0;
    for (let i = 0; i < octaves; i++) {
      sum += sample(x * frequency, y * frequency, period * frequency) * amplitude;
      total += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return sum / total;
  };
}

export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/** The defaults every texture starts from. */
export function resolve(settings: TextureSettings) {
  return {
    tile: 300,
    hard: 2,
    warp: 0.55,
    reach: 2.2,
    soft: 0.07,
    bias: 0.62,
    base: 0,
    seed: 11,
    blobs: [],
    ...settings,
  } satisfies TextureSettings & Record<string, unknown>;
}

/** `blobs` laid side by side every `span` widths, a span past either edge so none is cut off. */
function spread(blobs: NonNullable<TextureSettings["blobs"]>, span: number) {
  const spread: (typeof blobs)[number][] = [];
  for (let k = -1; k * span < 1 + span; k++) {
    for (const [x, y, r, w] of blobs) spread.push([(k + x) * span, y, r, w]);
  }
  return spread;
}

/** The labyrinth resampled to `tile` px once per tile size, so whole-pixel lookups are one read. */
const tables = new Map<number, Float32Array>();
function labyrinthTable(labyrinth: Labyrinth, tile: number): Float32Array {
  let table = tables.get(tile);
  if (table) return table;
  table = new Float32Array(tile * tile);
  const { data, size } = labyrinth;
  const scale = size / tile;
  for (let y = 0; y < tile; y++) {
    for (let x = 0; x < tile; x++) {
      const u = (x * scale) % size;
      const v = (y * scale) % size;
      const x0 = u | 0;
      const y0 = v | 0;
      const x1 = (x0 + 1) % size;
      const y1 = (y0 + 1) % size;
      const fx = u - x0;
      const fy = v - y0;
      const top = data[y0 * size + x0]! * (1 - fx) + data[y0 * size + x1]! * fx;
      const bottom = data[y1 * size + x0]! * (1 - fx) + data[y1 * size + x1]! * fx;
      table[y * tile + x] = top * (1 - fy) + bottom * fy;
    }
  }
  tables.set(tile, table);
  return table;
}

/**
 * Renders the texture as RGBA pixels, `width` by `height` (or one `repeat` px tile).
 *
 * The labyrinth is summed with a field of blobs, a ramp and noise, then thresholded: where the
 * field is strong the labyrinth fuses into a solid patch, and at its edge it frays back into lines.
 */
export function renderTexture(
  labyrinth: Labyrinth,
  settings: TextureSettings,
  width: number,
  height: number,
): { pixels: Uint8ClampedArray<ArrayBuffer>; width: number; height: number } {
  const s = resolve(settings);
  const w = Math.ceil(s.repeat ?? width);
  const h = Math.ceil(s.repeat ?? height);
  const pixels = new Uint8ClampedArray(w * h * 4);
  const color = parseHex(s.color);
  const inner = s.inner ? parseHex(s.inner) : undefined;
  const aspect = w / h;
  const blobs = s.span ? spread(s.blobs, s.span / aspect) : s.blobs;
  const noise = s.noise ? makeNoise(s.noise.seed ?? 7, s.repeat ? s.noise.scale : 0) : undefined;
  // a ramp's edge stays straight unless it asks for warp, which makes it lumpy
  const warped = blobs.length > 0 || (s.ramp && s.warp > 0);

  // the warp's frame: by default the render's height, the lumps scaling with it
  const kx = s.lumps ? w / s.lumps : aspect;
  const ky = s.lumps ? h / s.lumps : 1;
  // seamless, the warp comes round again after a whole number of lumps across
  const across = s.seamless ? Math.max(1, Math.round(2.1 * kx)) : 2.1 * kx;
  const warpX = makeNoise(s.seed, s.seamless ? across : 0);
  const warpY = makeNoise(s.seed + 1, s.seamless ? across : 0);
  const field = (u: number, v: number) => {
    let b = 0;
    // domain warp, so outlines are lumpy instead of round
    const wu = warped
      ? u + (s.warp * 0.5 * (warpX(u * across, v * 2.1 * ky, 3) - 0.5)) / (s.lumps ? kx : 1)
      : u;
    const wv = warped ? v + (s.warp * 0.5 * (warpY(u * across, v * 2.1 * ky, 3) - 0.5)) / ky : v;
    for (const [bx, by, br, bw] of blobs) {
      const d = Math.hypot((wu - bx) * aspect, wv - by) / br;
      b += bw * Math.exp(-(d ** s.hard));
    }
    if (s.ramp) b += Math.min(1, Math.max(0, (wv - s.ramp[0]) / (s.ramp[1] - s.ramp[0])));
    if (noise && s.noise) {
      const n = noise(u * s.noise.scale * aspect, v * s.noise.scale);
      b += Math.max(0, (n - s.noise.bias) * s.noise.amp);
    }
    return b;
  };

  // the field is smooth, so it is evaluated on a coarse grid and interpolated; only the
  // labyrinth is sampled per pixel
  const S = 4;
  const gw = Math.ceil(w / S) + 1;
  const gh = Math.ceil(h / S) + 1;
  const grid = new Float32Array(gw * gh);
  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) grid[j * gw + i] = field((i * S) / w, (j * S) / h);
  }

  const tile = Math.round(s.tile);
  const table = labyrinthTable(labyrinth, tile);
  for (let y = 0; y < h; y++) {
    const gy = y / S;
    const j0 = gy | 0;
    const fy = gy - j0;
    const row = (y % tile) * tile;
    for (let x = 0; x < w; x++) {
      const gx = x / S;
      const i0 = gx | 0;
      const fx = gx - i0;
      const g0 = j0 * gw + i0;
      const b =
        (grid[g0]! * (1 - fx) + grid[g0 + 1]! * fx) * (1 - fy) +
        (grid[g0 + gw]! * (1 - fx) + grid[g0 + gw + 1]! * fx) * fy;
      const r = table[row + (x % tile)]!;
      const f = r * Math.min(1, s.base + b * s.reach) + b * 0.9;
      const a = smoothstep(s.bias - s.soft, s.bias + s.soft, f);
      if (a <= 0) continue;

      const k = (y * w + x) * 4;
      // the labyrinth keeps running inside a solid core, in the inner tone
      const m = inner ? smoothstep(0.42, 0.58, r) * Math.min(1, Math.max(0, (b - 0.62) / 0.25)) : 0;
      const to = inner ?? color;
      pixels[k] = color[0] + (to[0] - color[0]) * m;
      pixels[k + 1] = color[1] + (to[1] - color[1]) * m;
      pixels[k + 2] = color[2] + (to[2] - color[2]) * m;
      pixels[k + 3] = (color[3] + (to[3] - color[3]) * m) * a;
    }
  }
  return { pixels, width: w, height: h };
}
