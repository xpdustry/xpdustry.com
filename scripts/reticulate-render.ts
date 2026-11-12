import type { TextureSettings } from "../src/lib/textures.ts";

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

type Rgba = readonly [number, number, number, number];

function parseHex(color: string): Rgba {
  const hex = color.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));
  return [r!, g!, b!, hex.length > 6 ? Number.parseInt(hex.slice(6, 8), 16) : 255];
}

function makeNoise(seed = 1, period = 0) {
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

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

function resolve(settings: TextureSettings) {
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
    ...settings
  } satisfies TextureSettings & Record<string, unknown>;
}

function spread(blobs: NonNullable<TextureSettings["blobs"]>, span: number) {
  const spread: (typeof blobs)[number][] = [];
  for (let k = -1; k * span < 1 + span; k++) {
    for (const [x, y, r, w] of blobs) spread.push([(k + x) * span, y, r, w]);
  }
  return spread;
}

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

type Settings = ReturnType<typeof resolve>;

/** Shifts a point by smooth noise, so outlines come out lumpy instead of perfectly round. */
function makeWarp(s: Settings, w: number, h: number) {
  const lumpsAcross = s.lumps ? w / s.lumps : w / h;
  const lumpsDown = s.lumps ? h / s.lumps : 1;
  const across = s.seamless ? Math.max(1, Math.round(2.1 * lumpsAcross)) : 2.1 * lumpsAcross;
  const reachAcross = s.lumps ? lumpsAcross : 1;
  const warpX = makeNoise(s.seed, s.seamless ? across : 0);
  const warpY = makeNoise(s.seed + 1, s.seamless ? across : 0);
  return (u: number, v: number): [number, number] => [
    u + (s.warp * 0.5 * (warpX(u * across, v * 2.1 * lumpsDown, 3) - 0.5)) / reachAcross,
    v + (s.warp * 0.5 * (warpY(u * across, v * 2.1 * lumpsDown, 3) - 0.5)) / lumpsDown
  ];
}

/** Scattered cells: the noise where it rises above `bias`, scaled by `amp`. */
function makeScatter(noise: NonNullable<Settings["noise"]>, aspect: number, tiled: boolean) {
  const sample = makeNoise(noise.seed ?? 7, tiled ? noise.scale : 0);
  return (u: number, v: number) =>
    Math.max(0, (sample(u * noise.scale * aspect, v * noise.scale) - noise.bias) * noise.amp);
}

/** The field's strength at a point in card units: the blobs, the level, the ramp and the noise. */
function makeField(s: Settings, w: number, h: number) {
  const aspect = w / h;
  const blobs = s.span ? spread(s.blobs, s.span / aspect) : s.blobs;
  const warp =
    blobs.length > 0 || (s.ramp && s.warp > 0)
      ? makeWarp(s, w, h)
      : (u: number, v: number): [number, number] => [u, v];
  const scatter = s.noise && makeScatter(s.noise, aspect, Boolean(s.repeat));
  return (u: number, v: number) => {
    const [wu, wv] = warp(u, v);
    let b = 0;
    for (const [bx, by, br, bw] of blobs) {
      const d = Math.hypot((wu - bx) * aspect, wv - by) / br;
      b += bw * Math.exp(-(d ** s.hard));
    }
    if (s.level) b += s.level;
    if (s.ramp) b += Math.min(1, Math.max(0, (wv - s.ramp[0]) / (s.ramp[1] - s.ramp[0])));
    if (scatter) b += scatter(u, v);
    return b;
  };
}

const GRID_STEP = 4;

/**
 * The field at a pixel, interpolated from samples `GRID_STEP` px apart: it varies slowly, and
 * evaluating it for every pixel is what would make a render slow.
 */
function sampleOnGrid(field: (u: number, v: number) => number, w: number, h: number) {
  const gw = Math.ceil(w / GRID_STEP) + 1;
  const gh = Math.ceil(h / GRID_STEP) + 1;
  const grid = new Float32Array(gw * gh);
  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) grid[j * gw + i] = field((i * GRID_STEP) / w, (j * GRID_STEP) / h);
  }
  return (x: number, y: number) => {
    const gx = x / GRID_STEP;
    const gy = y / GRID_STEP;
    const i0 = gx | 0;
    const j0 = gy | 0;
    const fx = gx - i0;
    const fy = gy - j0;
    const g0 = j0 * gw + i0;
    return (
      (grid[g0]! * (1 - fx) + grid[g0 + 1]! * fx) * (1 - fy) +
      (grid[g0 + gw]! * (1 - fx) + grid[g0 + gw + 1]! * fx) * fy
    );
  };
}

/** How far a labyrinth line turns from the main tone to the inner one, deep inside a strong field. */
function innerMix(line: number, strength: number): number {
  return smoothstep(0.42, 0.58, line) * Math.min(1, Math.max(0, (strength - 0.62) / 0.25));
}

function paint(
  pixels: Uint8ClampedArray,
  at: number,
  from: Rgba,
  to: Rgba,
  mix: number,
  alpha: number
) {
  pixels[at] = from[0] + (to[0] - from[0]) * mix;
  pixels[at + 1] = from[1] + (to[1] - from[1]) * mix;
  pixels[at + 2] = from[2] + (to[2] - from[2]) * mix;
  pixels[at + 3] = (from[3] + (to[3] - from[3]) * mix) * alpha;
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
  height: number
): { pixels: Uint8ClampedArray<ArrayBuffer>; width: number; height: number } {
  const s = resolve(settings);
  const w = Math.ceil(s.repeat ?? width);
  const h = Math.ceil(s.repeat ?? height);
  const strength = sampleOnGrid(makeField(s, w, h), w, h);
  const tile = Math.round(s.tile);
  const table = labyrinthTable(labyrinth, tile);
  const color = parseHex(s.color);
  const inner = s.inner ? parseHex(s.inner) : undefined;
  const pixels = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const b = strength(x, y);
      const r = table[(y % tile) * tile + (x % tile)]!;
      const f = r * Math.min(1, s.base + b * s.reach) + b * 0.9;
      const a = smoothstep(s.bias - s.soft, s.bias + s.soft, f);
      if (a <= 0) continue;
      paint(pixels, (y * w + x) * 4, color, inner ?? color, inner ? innerMix(r, b) : 0, a);
    }
  }
  return { pixels, width: w, height: h };
}
