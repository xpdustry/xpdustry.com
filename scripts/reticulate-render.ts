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
    ...settings,
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
  const warped = blobs.length > 0 || (s.ramp && s.warp > 0);

  const lumpsAcross = s.lumps ? w / s.lumps : aspect;
  const lumpsDown = s.lumps ? h / s.lumps : 1;
  const across = s.seamless ? Math.max(1, Math.round(2.1 * lumpsAcross)) : 2.1 * lumpsAcross;
  const warpX = makeNoise(s.seed, s.seamless ? across : 0);
  const warpY = makeNoise(s.seed + 1, s.seamless ? across : 0);
  const field = (u: number, v: number) => {
    let b = 0;
    const wu = warped
      ? u +
        (s.warp * 0.5 * (warpX(u * across, v * 2.1 * lumpsDown, 3) - 0.5)) /
          (s.lumps ? lumpsAcross : 1)
      : u;
    const wv = warped
      ? v + (s.warp * 0.5 * (warpY(u * across, v * 2.1 * lumpsDown, 3) - 0.5)) / lumpsDown
      : v;
    for (const [bx, by, br, bw] of blobs) {
      const d = Math.hypot((wu - bx) * aspect, wv - by) / br;
      b += bw * Math.exp(-(d ** s.hard));
    }
    if (s.level) b += s.level;
    if (s.ramp) b += Math.min(1, Math.max(0, (wv - s.ramp[0]) / (s.ramp[1] - s.ramp[0])));
    if (noise && s.noise) {
      const n = noise(u * s.noise.scale * aspect, v * s.noise.scale);
      b += Math.max(0, (n - s.noise.bias) * s.noise.amp);
    }
    return b;
  };

  const GRID_STEP = 4;
  const gw = Math.ceil(w / GRID_STEP) + 1;
  const gh = Math.ceil(h / GRID_STEP) + 1;
  const grid = new Float32Array(gw * gh);
  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) grid[j * gw + i] = field((i * GRID_STEP) / w, (j * GRID_STEP) / h);
  }

  const tile = Math.round(s.tile);
  const table = labyrinthTable(labyrinth, tile);
  for (let y = 0; y < h; y++) {
    const gy = y / GRID_STEP;
    const j0 = gy | 0;
    const fy = gy - j0;
    const row = (y % tile) * tile;
    for (let x = 0; x < w; x++) {
      const gx = x / GRID_STEP;
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
      const innerMix = inner
        ? smoothstep(0.42, 0.58, r) * Math.min(1, Math.max(0, (b - 0.62) / 0.25))
        : 0;
      const to = inner ?? color;
      pixels[k] = color[0] + (to[0] - color[0]) * innerMix;
      pixels[k + 1] = color[1] + (to[1] - color[1]) * innerMix;
      pixels[k + 2] = color[2] + (to[2] - color[2]) * innerMix;
      pixels[k + 3] = (color[3] + (to[3] - color[3]) * innerMix) * a;
    }
  }
  return { pixels, width: w, height: h };
}
