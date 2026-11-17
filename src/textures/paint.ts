import { DEFAULT_SOFT_EDGE, type FieldBlob, type Px, type TextureSettings } from "./texture.ts";

if (new Uint8Array(Uint32Array.of(1).buffer)[0] !== 1) {
  throw new Error("the painter writes each RGBA pixel as one little-endian word");
}

export interface Labyrinth {
  data: Float32Array;
  size: Px;
}

export function toLabyrinth(
  pixels: ArrayLike<number>,
  channelsPerPixel: number,
  size: Px
): Labyrinth {
  let max = 0;
  for (let i = 0; i < pixels.length; i += channelsPerPixel) max = Math.max(max, pixels[i]!);
  const data = new Float32Array(size * size);
  for (let i = 0; i < data.length; i++) data[i] = pixels[i * channelsPerPixel]! / max;
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

const THRESHOLD = 0.62;

function resolve(settings: TextureSettings) {
  return {
    fray: 2.2,
    softEdge: DEFAULT_SOFT_EDGE,
    blobs: [],
    ...settings,
    lumps: { depth: 0.55, seed: 11, ...settings.lumps }
  } satisfies TextureSettings;
}

type Settings = ReturnType<typeof resolve>;

function wrappedAcrossEdges(blobs: readonly FieldBlob[]): FieldBlob[] {
  return [-1, 0, 1].flatMap((offset) =>
    blobs.map(([x, y, radius]): FieldBlob => [offset + x, y, radius])
  );
}

const NOISE_CELLS_PER_LUMP = 2.1;

function makeLumps({ lumps, seamless }: Settings, w: number, h: number) {
  const lumpsAcross = lumps.size ? w / lumps.size : w / h;
  const lumpsDown = lumps.size ? h / lumps.size : 1;
  const across = seamless
    ? Math.max(1, Math.round(NOISE_CELLS_PER_LUMP * lumpsAcross))
    : NOISE_CELLS_PER_LUMP * lumpsAcross;
  const reachAcross = lumps.size ? lumpsAcross : 1;
  const shiftX = makeNoise(lumps.seed, seamless ? across : 0);
  const shiftY = makeNoise(lumps.seed + 1, seamless ? across : 0);
  const down = NOISE_CELLS_PER_LUMP * lumpsDown;
  const pull = lumps.depth * 0.5;
  return {
    u: (u: number, v: number) => u + (pull * (shiftX(u * across, v * down, 3) - 0.5)) / reachAcross,
    v: (u: number, v: number) => v + (pull * (shiftY(u * across, v * down, 3) - 0.5)) / lumpsDown
  };
}

function makeScatter(
  { cells, threshold, gain, seed = 7 }: NonNullable<Settings["scatter"]>,
  aspect: number,
  tiled: boolean
) {
  const sample = makeNoise(seed, tiled ? cells : 0);
  return (u: number, v: number) =>
    Math.max(0, (sample(u * cells * aspect, v * cells) - threshold) * gain);
}

const EXPONENT_OUTSIDE_BLOB = 20;

function makeBlobs(blobs: readonly FieldBlob[], aspect: number) {
  return (u: number, v: number) => {
    let strength = 0;
    for (const [x, y, radius] of blobs) {
      const dx = (u - x) * aspect;
      const dy = v - y;
      const squared = (dx * dx + dy * dy) / (radius * radius);
      const exponent = squared * squared * squared;
      if (exponent < EXPONENT_OUTSIDE_BLOB) strength += Math.exp(-exponent);
    }
    return strength;
  };
}

function makeField(s: Settings, w: number, h: number) {
  const aspect = w / h;
  const blobs = makeBlobs(s.seamless ? wrappedAcrossEdges(s.blobs) : s.blobs, aspect);
  const lumps =
    s.blobs.length > 0 || (s.ramp && s.lumps.depth > 0) ? makeLumps(s, w, h) : undefined;
  const scatter = s.scatter && makeScatter(s.scatter, aspect, Boolean(s.repeat));
  const { ramp, baseStrength = 0 } = s;
  return (u: number, v: number) => {
    const wu = lumps ? lumps.u(u, v) : u;
    const wv = lumps ? lumps.v(u, v) : v;
    let b = blobs(wu, wv) + baseStrength;
    if (ramp) b += Math.min(1, Math.max(0, (wv - ramp.clearAt) / (ramp.solidAt - ramp.clearAt)));
    if (scatter) b += scatter(u, v);
    return b;
  };
}

const gridStepShift = (w: number, h: number) => (Math.min(w, h) >= 160 ? 3 : 2);

interface Grid {
  values: Float32Array;
  width: number;
  stepShift: number;
}

function sampleField(field: (u: number, v: number) => number, w: number, h: number): Grid {
  const stepShift = gridStepShift(w, h);
  const step = 1 << stepShift;
  const width = Math.ceil(w / step) + 1;
  const height = Math.ceil(h / step) + 1;
  const values = new Float32Array(width * height);
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) values[j * width + i] = field((i * step) / w, (j * step) / h);
  }
  return { values, width, stepShift };
}

interface Tile {
  labyrinth: Float32Array;
  innerMix: Float32Array;
  size: Px;
}

const tiles = new WeakMap<Labyrinth, Map<number, Tile>>();

function tileOf(labyrinth: Labyrinth, size: Px): Tile {
  let sizes = tiles.get(labyrinth);
  if (!sizes) tiles.set(labyrinth, (sizes = new Map()));
  let tile = sizes.get(size);
  if (!tile) sizes.set(size, (tile = resample(labyrinth, size)));
  return tile;
}

function resample({ data, size: from }: Labyrinth, size: Px): Tile {
  const labyrinth = new Float32Array(size * size);
  const innerMix = new Float32Array(size * size);
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
      labyrinth[y * size + x] = value;
      innerMix[y * size + x] = smoothstep(0.42, 0.58, value);
    }
  }
  return { labyrinth, innerMix, size };
}

const CLEAR = 0;
const FRAYED = 1;
const FUSED = 2;

const LABYRINTH_LOWEST = 0;
const LABYRINTH_HIGHEST = 1;

const coverage = (labyrinth: number, strength: number, fray: number) =>
  labyrinth * Math.min(1, strength * fray) + strength * 0.9;

interface Brush {
  grid: Grid;
  tile: Tile;
  fray: number;
  coverageFrom: number;
  coverageRise: number;
  from: Rgba;
  to: Rgba;
  oneTone: boolean;
  toneWithoutAlpha: number;
  solidWord: number;
  tileColumns: Uint16Array;
  words: Uint32Array;
  width: Px;
  rowField: Float32Array;
  rowCells: Uint8Array;
}

function classifyRowCells({ grid, rowCells, fray, coverageFrom, coverageRise }: Brush, at: number) {
  const { values, width } = grid;
  const coverageFull = coverageFrom + 1 / coverageRise;
  for (let i = 0; i < width - 1; i++) {
    const a = values[at + i]!;
    const b = values[at + i + 1]!;
    const c = values[at + width + i]!;
    const d = values[at + width + i + 1]!;
    const strongest = Math.max(a, b, c, d);
    const weakest = Math.min(a, b, c, d);
    if (coverage(LABYRINTH_HIGHEST, strongest, fray) <= coverageFrom) rowCells[i] = CLEAR;
    else rowCells[i] = coverage(LABYRINTH_LOWEST, weakest, fray) >= coverageFull ? FUSED : FRAYED;
  }
}

function blendedWord(from: Rgba, to: Rgba, mix: number, alpha: number) {
  const r = (from[0] + (to[0] - from[0]) * mix + 0.5) | 0;
  const g = (from[1] + (to[1] - from[1]) * mix + 0.5) | 0;
  const b = (from[2] + (to[2] - from[2]) * mix + 0.5) | 0;
  const a = ((from[3] + (to[3] - from[3]) * mix) * alpha + 0.5) | 0;
  return (a << 24) | (b << 16) | (g << 8) | r;
}

function paintCoveredPx(
  brush: Brush,
  fused: boolean,
  cell: number,
  startX: Px,
  endX: Px,
  rowStart: number,
  tileRowStart: number
) {
  const { tile, fray, coverageFrom, coverageRise, oneTone, toneWithoutAlpha } = brush;
  const { tileColumns, words, rowField } = brush;
  const step = 1 << brush.grid.stepShift;
  const slope = (rowField[cell + 1]! - rowField[cell]!) / step;
  let strength = rowField[cell]!;
  for (let x = startX; x < endX; x++, strength += slope) {
    const at = tileRowStart + tileColumns[x]!;
    let alpha = 1;
    if (!fused) {
      const covered = (coverage(tile.labyrinth[at]!, strength, fray) - coverageFrom) * coverageRise;
      if (covered <= 0) continue;
      if (covered < 1) alpha = covered * covered * (3 - 2 * covered);
    }
    if (oneTone) {
      words[rowStart + x] = (((brush.from[3] * alpha + 0.5) | 0) << 24) | toneWithoutAlpha;
    } else {
      const mix = Math.min(1, Math.max(0, (strength - 0.62) / 0.25)) * tile.innerMix[at]!;
      words[rowStart + x] = blendedWord(brush.from, brush.to, mix, alpha);
    }
  }
}

function paintRow(brush: Brush, y: number) {
  const { tile, oneTone, solidWord, words, width, rowCells } = brush;
  const step = 1 << brush.grid.stepShift;
  const tileRowStart = (y % tile.size) * tile.size;
  const rowStart = y * width;
  for (let cell = 0, x = 0; x < width; cell++, x += step) {
    const kind = rowCells[cell]!;
    if (kind === CLEAR) continue;
    const end = Math.min(width, x + step);
    if (kind === FUSED && oneTone) words.fill(solidWord, rowStart + x, rowStart + end);
    else paintCoveredPx(brush, kind === FUSED, cell, x, end, rowStart, tileRowStart);
  }
}

export function paintTexture(
  labyrinth: Labyrinth,
  settings: TextureSettings,
  width: Px,
  height: Px
): { pixels: Uint8ClampedArray<ArrayBuffer>; width: Px; height: Px } {
  const s = resolve(settings);
  const w = Math.ceil(s.repeat ?? width);
  const h = Math.ceil(s.repeat ?? height);
  const grid = sampleField(makeField(s, w, h), w, h);
  const tile = tileOf(labyrinth, Math.round(s.tile));
  const from = parseHex(s.color);
  const to = s.inner ? parseHex(s.inner) : from;
  const pixels = new Uint8ClampedArray(w * h * 4);
  const tileColumns = new Uint16Array(w);
  for (let x = 0; x < w; x++) tileColumns[x] = x % tile.size;
  const toneWithoutAlpha = (from[2] << 16) | (from[1] << 8) | from[0];
  const brush: Brush = {
    grid,
    tile,
    fray: s.fray,
    coverageFrom: THRESHOLD - s.softEdge,
    coverageRise: 1 / (2 * s.softEdge),
    from,
    to,
    oneTone: to.every((channel, at) => channel === from[at]),
    toneWithoutAlpha,
    solidWord: ((from[3] << 24) | toneWithoutAlpha) >>> 0,
    tileColumns,
    words: new Uint32Array(pixels.buffer),
    width: w,
    rowField: new Float32Array(grid.width),
    rowCells: new Uint8Array(grid.width)
  };
  const step = 1 << grid.stepShift;
  for (let y = 0; y < h; y++) {
    const at = (y >> grid.stepShift) * grid.width;
    const fy = (y & (step - 1)) / step;
    if (fy === 0) classifyRowCells(brush, at);
    for (let i = 0; i < grid.width; i++) {
      brush.rowField[i] = grid.values[at + i]! * (1 - fy) + grid.values[at + grid.width + i]! * fy;
    }
    paintRow(brush, y);
  }
  return { pixels, width: w, height: h };
}
