import type { TextureSettings } from "./texture.ts";

/** The labyrinth tile, as alpha in 0..1, `size` px square. */
export interface Labyrinth {
  data: Float32Array;
  size: number;
}

/** The labyrinth from decoded pixels: `channels` values per pixel, the pattern in the first one. */
export function toLabyrinth(pixels: ArrayLike<number>, channels: number, size: number): Labyrinth {
  let max = 0;
  for (let i = 0; i < pixels.length; i += channels) max = Math.max(max, pixels[i]!);
  const data = new Float32Array(size * size);
  for (let i = 0; i < data.length; i++) data[i] = pixels[i * channels]! / max;
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
    seed: 11,
    blobs: [],
    ...settings
  } satisfies TextureSettings & Record<string, unknown>;
}

type Settings = ReturnType<typeof resolve>;
type Blobs = NonNullable<TextureSettings["blobs"]>;

function spread(blobs: Blobs, span: number) {
  const spread: Blobs[number][] = [];
  for (let k = -1; k * span < 1 + span; k++) {
    for (const [x, y, r, w] of blobs) spread.push([(k + x) * span, y, r, w]);
  }
  return spread;
}

/** Shifts a point by smooth noise, so outlines come out lumpy instead of perfectly round. */
function makeWarp(s: Settings, w: number, h: number) {
  const lumpsAcross = s.lumps ? w / s.lumps : w / h;
  const lumpsDown = s.lumps ? h / s.lumps : 1;
  const across = s.seamless ? Math.max(1, Math.round(2.1 * lumpsAcross)) : 2.1 * lumpsAcross;
  const reachAcross = s.lumps ? lumpsAcross : 1;
  const warpX = makeNoise(s.seed, s.seamless ? across : 0);
  const warpY = makeNoise(s.seed + 1, s.seamless ? across : 0);
  const down = 2.1 * lumpsDown;
  const pull = s.warp * 0.5;
  return {
    u: (u: number, v: number) => u + (pull * (warpX(u * across, v * down, 3) - 0.5)) / reachAcross,
    v: (u: number, v: number) => v + (pull * (warpY(u * across, v * down, 3) - 0.5)) / lumpsDown
  };
}

/** Scattered cells: the noise where it rises above `bias`, scaled by `amp`. */
function makeScatter(noise: NonNullable<Settings["noise"]>, aspect: number, tiled: boolean) {
  const sample = makeNoise(noise.seed ?? 7, tiled ? noise.scale : 0);
  return (u: number, v: number) =>
    Math.max(0, (sample(u * noise.scale * aspect, v * noise.scale) - noise.bias) * noise.amp);
}

/** Past this exponent a blob adds less than a billionth: the point is outside it. */
const OUTSIDE = 20;

/**
 * The blobs' strength at a point: each one `weight * exp(-distance ** hard)`. It works on the
 * squared distance, so the usual hardnesses of 2 and 6 take no root and no `pow`.
 */
function makeBlobs(blobs: Blobs, aspect: number, hard: number) {
  const half = hard / 2;
  const falloff =
    half === 3
      ? (q: number) => q * q * q
      : half === 1
        ? (q: number) => q
        : (q: number) => Math.pow(q, half);
  return (u: number, v: number) => {
    let strength = 0;
    for (const [x, y, radius, weight] of blobs) {
      const dx = (u - x) * aspect;
      const dy = v - y;
      const exponent = falloff((dx * dx + dy * dy) / (radius * radius));
      if (exponent < OUTSIDE) strength += weight * Math.exp(-exponent);
    }
    return strength;
  };
}

/** The field's strength at a point in card units: the blobs, the level, the ramp and the noise. */
function makeField(s: Settings, w: number, h: number) {
  const aspect = w / h;
  const blobs = makeBlobs(s.span ? spread(s.blobs, s.span / aspect) : s.blobs, aspect, s.hard);
  const warp = s.blobs.length > 0 || (s.ramp && s.warp > 0) ? makeWarp(s, w, h) : undefined;
  const scatter = s.noise && makeScatter(s.noise, aspect, Boolean(s.repeat));
  const { ramp, level = 0 } = s;
  return (u: number, v: number) => {
    const wu = warp ? warp.u(u, v) : u;
    const wv = warp ? warp.v(u, v) : v;
    let b = blobs(wu, wv) + level;
    if (ramp) b += Math.min(1, Math.max(0, (wv - ramp[0]) / (ramp[1] - ramp[0])));
    if (scatter) b += scatter(u, v);
    return b;
  };
}

/**
 * The field varies slowly, so it is sampled on a grid and interpolated between: every 4 px, or
 * every 8 in a texture large enough for its blobs to span many cells. `shift` is that step as a
 * power of two.
 */
const shiftFor = (w: number, h: number) => (Math.min(w, h) >= 160 ? 3 : 2);

interface Grid {
  values: Float32Array;
  width: number;
  shift: number;
}

function sampleField(field: (u: number, v: number) => number, w: number, h: number): Grid {
  const shift = shiftFor(w, h);
  const step = 1 << shift;
  const width = Math.ceil(w / step) + 1;
  const height = Math.ceil(h / step) + 1;
  const values = new Float32Array(width * height);
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) values[j * width + i] = field((i * step) / w, (j * step) / h);
  }
  return { values, width, shift };
}

interface Tile {
  /** The labyrinth at the tile's size. */
  line: Float32Array;
  /** How far each of its points turns to the inner tone, where the field is strong. */
  mix: Float32Array;
  size: number;
}

const tiles = new WeakMap<Labyrinth, Map<number, Tile>>();

function tileOf(labyrinth: Labyrinth, size: number): Tile {
  let sizes = tiles.get(labyrinth);
  if (!sizes) tiles.set(labyrinth, (sizes = new Map()));
  let tile = sizes.get(size);
  if (!tile) sizes.set(size, (tile = resample(labyrinth, size)));
  return tile;
}

function resample({ data, size: from }: Labyrinth, size: number): Tile {
  const line = new Float32Array(size * size);
  const mix = new Float32Array(size * size);
  const scale = from / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x * scale) % from;
      const v = (y * scale) % from;
      const x0 = u | 0;
      const y0 = v | 0;
      const x1 = (x0 + 1) % from;
      const y1 = (y0 + 1) % from;
      const fx = u - x0;
      const fy = v - y0;
      const top = data[y0 * from + x0]! * (1 - fx) + data[y0 * from + x1]! * fx;
      const bottom = data[y1 * from + x0]! * (1 - fx) + data[y1 * from + x1]! * fx;
      const value = top * (1 - fy) + bottom * fy;
      line[y * size + x] = value;
      mix[y * size + x] = smoothstep(0.42, 0.58, value);
    }
  }
  return { line, mix, size };
}

/** What a cell of the field's grid holds: nothing, the labyrinth's edge, or a fused patch. */
const CLEAR = 0;
const FRAYED = 1;
const FUSED = 2;

/** Everything a row needs, worked out once per texture. */
interface Brush {
  grid: Grid;
  tile: Tile;
  /** The threshold: the field's pull on a line, where coverage starts, and how fast it rises. */
  reach: number;
  low: number;
  rise: number;
  from: Rgba;
  to: Rgba;
  /** One tone all over, so a fused cell is a single colour. */
  flat: boolean;
  /** The main tone without its alpha, and at full strength, as little-endian RGBA words. */
  tone: number;
  solid: number;
  /** Each column's place in the labyrinth tile. */
  columns: Uint16Array;
  words: Uint32Array;
  width: number;
  /** The field along the row being painted, and what each of its cells holds. */
  row: Float32Array;
  cells: Uint8Array;
}

/**
 * What each cell of a grid row holds, from its corners: the labyrinth is in 0..1, so a cell whose
 * strongest corner cannot reach the threshold is clear, and one whose weakest is past it is fused.
 */
function classify({ grid, cells, reach, low, rise }: Brush, at: number) {
  const { values, width } = grid;
  const high = low + 1 / rise;
  for (let i = 0; i < width - 1; i++) {
    const a = values[at + i]!;
    const b = values[at + i + 1]!;
    const c = values[at + width + i]!;
    const d = values[at + width + i + 1]!;
    const strongest = Math.max(a, b, c, d);
    const weakest = Math.min(a, b, c, d);
    if (Math.min(1, strongest * reach) + strongest * 0.9 <= low) cells[i] = CLEAR;
    else cells[i] = weakest * 0.9 >= high ? FUSED : FRAYED;
  }
}

/** One px of the two tones, `mix` of the way to the inner one, as an RGBA word. */
function blend(from: Rgba, to: Rgba, mix: number, alpha: number) {
  const r = (from[0] + (to[0] - from[0]) * mix + 0.5) | 0;
  const g = (from[1] + (to[1] - from[1]) * mix + 0.5) | 0;
  const b = (from[2] + (to[2] - from[2]) * mix + 0.5) | 0;
  const a = ((from[3] + (to[3] - from[3]) * mix) * alpha + 0.5) | 0;
  return (a << 24) | (b << 16) | (g << 8) | r;
}

/** Paints the px of one cell that the labyrinth covers: `from` up to `end` in the row at `out`. */
function paintCell(
  brush: Brush,
  fused: boolean,
  cell: number,
  from: number,
  end: number,
  out: number,
  lines: number
) {
  const { tile, reach, low, rise, flat, tone, columns, words, row } = brush;
  const step = 1 << brush.grid.shift;
  const slope = (row[cell + 1]! - row[cell]!) / step;
  let strength = row[cell]!;
  for (let x = from; x < end; x++, strength += slope) {
    const at = lines + columns[x]!;
    let alpha = 1;
    if (!fused) {
      // The field and the line, thresholded: how much of this px the labyrinth covers.
      const t = (tile.line[at]! * Math.min(1, strength * reach) + strength * 0.9 - low) * rise;
      if (t <= 0) continue;
      if (t < 1) alpha = t * t * (3 - 2 * t);
    }
    if (flat) {
      words[out + x] = (((brush.from[3] * alpha + 0.5) | 0) << 24) | tone;
    } else {
      const mix = Math.min(1, Math.max(0, (strength - 0.62) / 0.25)) * tile.mix[at]!;
      words[out + x] = blend(brush.from, brush.to, mix, alpha);
    }
  }
}

/** Paints a row cell by cell: a clear cell costs nothing, and a fused one of a single tone one fill. */
function paintRow(brush: Brush, y: number) {
  const { tile, flat, solid, words, width, cells } = brush;
  const step = 1 << brush.grid.shift;
  const lines = (y % tile.size) * tile.size;
  const out = y * width;
  for (let cell = 0, x = 0; x < width; cell++, x += step) {
    const kind = cells[cell]!;
    if (kind === CLEAR) continue;
    const end = Math.min(width, x + step);
    if (kind === FUSED && flat) words.fill(solid, out + x, out + end);
    else paintCell(brush, kind === FUSED, cell, x, end, out, lines);
  }
}

/**
 * Paints the texture as RGBA pixels, `width` by `height` (or one `repeat` px tile).
 *
 * The labyrinth is summed with a field of blobs, a ramp and noise, then thresholded: where the
 * field is strong the labyrinth fuses into a solid patch, and at its edge it frays back into lines.
 *
 * It runs in the visitor's browser, so it spends nothing on what the field leaves clear, and
 * fills what it leaves fused when that is a single tone.
 */
export function paintTexture(
  labyrinth: Labyrinth,
  settings: TextureSettings,
  width: number,
  height: number
): { pixels: Uint8ClampedArray<ArrayBuffer>; width: number; height: number } {
  const s = resolve(settings);
  const w = Math.ceil(s.repeat ?? width);
  const h = Math.ceil(s.repeat ?? height);
  const grid = sampleField(makeField(s, w, h), w, h);
  const tile = tileOf(labyrinth, Math.round(s.tile));
  const from = parseHex(s.color);
  const to = s.inner ? parseHex(s.inner) : from;
  const pixels = new Uint8ClampedArray(w * h * 4);
  const columns = new Uint16Array(w);
  for (let x = 0; x < w; x++) columns[x] = x % tile.size;
  const tone = (from[2] << 16) | (from[1] << 8) | from[0];
  const brush: Brush = {
    grid,
    tile,
    reach: s.reach,
    low: s.bias - s.soft,
    rise: 1 / (2 * s.soft),
    from,
    to,
    flat: to.every((channel, at) => channel === from[at]),
    tone,
    solid: ((from[3] << 24) | tone) >>> 0,
    columns,
    // Every browser this runs in is little-endian, so a word is one RGBA pixel.
    words: new Uint32Array(pixels.buffer),
    width: w,
    row: new Float32Array(grid.width),
    cells: new Uint8Array(grid.width)
  };
  const step = 1 << grid.shift;
  for (let y = 0; y < h; y++) {
    const at = (y >> grid.shift) * grid.width;
    const fy = (y & (step - 1)) / step;
    if (fy === 0) classify(brush, at);
    for (let i = 0; i < grid.width; i++) {
      brush.row[i] = grid.values[at + i]! * (1 - fy) + grid.values[at + grid.width + i]! * fy;
    }
    paintRow(brush, y);
  }
  return { pixels, width: w, height: h };
}
