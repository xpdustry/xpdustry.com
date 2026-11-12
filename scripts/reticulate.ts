const KERNEL = [1, 4, 1, 4, -20, 4, 1, 4, 1].map((weight) => weight / 6);
const NET_CUTOFF = 0.34;

interface PhaseOptions {
  ratio: number;
  scale: number;
  speed: number;
  steps: number;
  floorB: number;
  growEvery?: number;
}

export interface Field {
  a: Float64Array;
  b: Float64Array;
  width: number;
  height: number;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedField(size: number, random: () => number): Field {
  const cells = size * size;
  const a = new Float64Array(cells).fill(4);
  const b = new Float64Array(cells);
  for (let i = 0; i < cells; i += 1) b[i] = 4 + random();
  return { a, b, width: size, height: size };
}

function wrappedLaplacian(
  source: Float64Array,
  out: Float64Array,
  width: number,
  height: number,
): void {
  for (let y = 0; y < height; y += 1) {
    const up = ((y - 1 + height) % height) * width;
    const mid = y * width;
    const down = ((y + 1) % height) * width;
    for (let x = 0; x < width; x += 1) {
      const left = (x - 1 + width) % width;
      const right = (x + 1) % width;
      out[mid + x] =
        KERNEL[0] * source[up + left] +
        KERNEL[1] * source[up + x] +
        KERNEL[2] * source[up + right] +
        KERNEL[3] * source[mid + left] +
        KERNEL[4] * source[mid + x] +
        KERNEL[5] * source[mid + right] +
        KERNEL[6] * source[down + left] +
        KERNEL[7] * source[down + x] +
        KERNEL[8] * source[down + right];
    }
  }
}

/** `source` one column wider: each row repeats the point at its cut. */
function widen(source: Float64Array, width: number, height: number, cuts: number[]): Float64Array {
  const wider = new Float64Array((width + 1) * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x <= width; x += 1) {
      wider[y * (width + 1) + x] = source[y * width + (x > cuts[y]! ? x - 1 : x)]!;
    }
  }
  return wider;
}

/** `source` one row taller: each column repeats the point at its cut. */
function heighten(
  source: Float64Array,
  width: number,
  height: number,
  cuts: number[],
): Float64Array {
  const taller = new Float64Array(width * (height + 1));
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y <= height; y += 1) {
      taller[y * width + x] = source[(y > cuts[x]! ? y - 1 : y) * width + x]!;
    }
  }
  return taller;
}

function grow(field: Field, random: () => number): Field {
  const { a, b, width, height } = field;
  const columnCuts = Array.from({ length: height }, () => Math.floor(random() * width));
  const rowCuts = Array.from({ length: width + 1 }, () => Math.floor(random() * height));
  const stretch = (source: Float64Array) =>
    heighten(widen(source, width, height, columnCuts), width + 1, height, rowCuts);
  return { a: stretch(a), b: stretch(b), width: width + 1, height: height + 1 };
}

function runPhase(field: Field, options: PhaseOptions, random: () => number): Field {
  const diffusionA = options.ratio * options.scale;
  const diffusionB = options.scale;
  const dt = (0.01 * options.speed) / 100;
  let current = field;
  let lapA = new Float64Array(current.a.length);
  let lapB = new Float64Array(current.b.length);

  for (let step = 1; step <= options.steps; step += 1) {
    if (options.growEvery && step % options.growEvery === 1) {
      current = grow(current, random);
      lapA = new Float64Array(current.a.length);
      lapB = new Float64Array(current.b.length);
    }
    const { a, b, width, height } = current;
    wrappedLaplacian(a, lapA, width, height);
    wrappedLaplacian(b, lapB, width, height);
    for (let i = 0; i < a.length; i += 1) {
      const na = a[i] + (16 - a[i] * b[i] + diffusionA * lapA[i]) * dt;
      const nb = b[i] + (a[i] * b[i] - b[i] - 12 + diffusionB * lapB[i]) * dt;
      a[i] = na < 0 ? 0 : na > 1000 ? 1000 : na;
      b[i] = nb < options.floorB ? options.floorB : nb > 1000 ? 1000 : nb;
    }
  }

  return current;
}

const RETICULATE_PHASES: readonly PhaseOptions[] = [
  { ratio: 30, scale: 3, speed: 40, steps: 4000, floorB: 2 },
  { ratio: 8, scale: 3, speed: 40, steps: 10000, floorB: 2, growEvery: 100 },
];

/** Run the complete two-phase recipe and return its final morphogen fields. */
export function reticulateField(size = 100, seed = 1): Field {
  const random = mulberry32(seed);
  let field = seedField(size, random);
  for (const phase of RETICULATE_PHASES) field = runPhase(field, phase, random);
  return field;
}

/** How much of a point the net covers, from B normalised to 0..1: all of it at 0, none past the cutoff. */
function netCoverage(normalisedB: number): number {
  const coverage = Math.max(0, 1 - normalisedB / NET_CUTOFF);
  return coverage * coverage * (3 - 2 * coverage);
}

export function toMask(field: Field): Uint8Array {
  const { b } = field;
  let low = Infinity;
  let high = -Infinity;
  for (const value of b) {
    if (value < low) low = value;
    if (value > high) high = value;
  }
  const span = high - low || 1;
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i += 1) {
    out[i] = Math.round(255 * netCoverage((b[i]! - low) / span));
  }
  return out;
}

export function wrappedBoxBlur(
  mask: Uint8Array,
  width: number,
  height: number,
  radius: number,
): Uint8Array {
  let current = mask;
  for (let pass = 0; pass < 3; pass += 1) {
    current = boxPass(current, width, height, radius, true);
    current = boxPass(current, width, height, radius, false);
  }
  return current;
}

function boxPass(
  source: Uint8Array,
  width: number,
  height: number,
  radius: number,
  horizontal: boolean,
): Uint8Array {
  const out = new Uint8Array(source.length);
  const length = horizontal ? width : height;
  const lines = horizontal ? height : width;
  const window = radius * 2 + 1;

  for (let line = 0; line < lines; line += 1) {
    const at = (index: number) => {
      const wrapped = ((index % length) + length) % length;
      return horizontal ? line * width + wrapped : wrapped * width + line;
    };
    let total = 0;
    for (let offset = -radius; offset <= radius; offset += 1) total += source[at(offset)];
    for (let index = 0; index < length; index += 1) {
      out[at(index)] = Math.round(total / window);
      total -= source[at(index - radius)];
      total += source[at(index + radius + 1)];
    }
  }

  return out;
}
