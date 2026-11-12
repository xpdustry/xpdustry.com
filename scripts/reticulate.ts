/**
 * The reticulate whipray pattern as a bounded, nonlinear Turing
 * reaction-diffusion system.
 *
 * Ported from Malheiros' Himantura uarnak experiment for "The leopard never
 * changes its spots" (SIGGRAPH 2020):
 * https://github.com/mgmalheiros/reaction-diffusion
 *
 * The first phase uses a high diffusion ratio to settle into round spots. The
 * second lowers that ratio while the tissue grows, pulling the spots into the
 * open network that gives the ray its name.
 *
 * Convolution wraps at the edges, and growth inserts duplicated rows and
 * columns. The field therefore remains periodic and the output tiles cleanly.
 */

/** The 3x3 discrete Laplacian through which both morphogens diffuse. */
const KERNEL = [1, 4, 1, 4, -20, 4, 1, 4, 1].map((weight) => weight / 6);
/** The point where the reference colour ramp has faded into its ground. */
const NET_CUTOFF = 0.34;

export interface PhaseOptions {
  /** Diffusion ratio between the morphogens. High values form spots, low values form nets. */
  ratio: number;
  /** Overall diffusion scale, which controls the pattern's coarseness. */
  scale: number;
  /** Integration speed. The reference uses 40 and dt = 0.01 * speed / 100. */
  speed: number;
  /** Number of integration steps. */
  steps: number;
  /** Lower clamp on B. Keeping B above zero bounds the model. */
  floorB: number;
  /** Insert one row and one column at this interval when set. */
  growEvery?: number;
}

export interface Field {
  a: Float64Array;
  b: Float64Array;
  width: number;
  height: number;
}

/**
 * Mulberry32 supplies reproducible noise. Matching NumPy's Mersenne Twister
 * bit for bit would not change the model's attractor, only its initial noise.
 */
function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Start with flat A and add slight noise to B to break spatial symmetry. */
export function seedField(size: number, random: () => number): Field {
  const cells = size * size;
  const a = new Float64Array(cells).fill(4);
  const b = new Float64Array(cells);
  for (let i = 0; i < cells; i += 1) b[i] = 4 + random();
  return { a, b, width: size, height: size };
}

/**
 * Convolve one field with the discrete Laplacian. Modulo indexing matches the
 * reference implementation's wrapped boundary and keeps the result tileable.
 */
function laplacian(source: Float64Array, out: Float64Array, width: number, height: number): void {
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

/**
 * Grow the simulated tissue by one row and column. Each insertion duplicates
 * a random point along its line, stretching the existing pattern without
 * replacing it. Round spots drift apart and the reaction reconnects them.
 */
function grow(field: Field, random: () => number): Field {
  const { a, b, width, height } = field;
  const w = width + 1;
  const h = height + 1;
  const na = new Float64Array(w * h);
  const nb = new Float64Array(w * h);

  // Insert a column first, then a row into that intermediate field.
  const ta = new Float64Array(w * height);
  const tb = new Float64Array(w * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      ta[y * w + x] = a[y * width + x];
      tb[y * w + x] = b[y * width + x];
    }
    const cut = Math.floor(random() * width);
    for (let x = width; x > cut; x -= 1) {
      ta[y * w + x] = a[y * width + Math.min(x - 1, width - 1)];
      tb[y * w + x] = b[y * width + Math.min(x - 1, width - 1)];
    }
  }
  for (let x = 0; x < w; x += 1) {
    for (let y = 0; y < height; y += 1) {
      na[y * w + x] = ta[y * w + x];
      nb[y * w + x] = tb[y * w + x];
    }
    const cut = Math.floor(random() * height);
    for (let y = height; y > cut; y -= 1) {
      na[y * w + x] = ta[Math.min(y - 1, height - 1) * w + x];
      nb[y * w + x] = tb[Math.min(y - 1, height - 1) * w + x];
    }
  }

  return { a: na, b: nb, width: w, height: h };
}

/** Advance one reaction-diffusion phase, returning the possibly grown field. */
export function runPhase(field: Field, options: PhaseOptions, random: () => number): Field {
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
    laplacian(a, lapA, width, height);
    laplacian(b, lapB, width, height);
    for (let i = 0; i < a.length; i += 1) {
      const na = a[i] + (16 - a[i] * b[i] + diffusionA * lapA[i]) * dt;
      const nb = b[i] + (a[i] * b[i] - b[i] - 12 + diffusionB * lapB[i]) * dt;
      a[i] = na < 0 ? 0 : na > 1000 ? 1000 : na;
      b[i] = nb < options.floorB ? options.floorB : nb > 1000 ? 1000 : nb;
    }
  }

  return current;
}

/** The two phases used by the reference Himantura uarnak experiment. */
export const RETICULATE_PHASES: readonly PhaseOptions[] = [
  { ratio: 30, scale: 3, speed: 40, steps: 4000, floorB: 2 },
  { ratio: 8, scale: 3, speed: 40, steps: 10000, floorB: 2, growEvery: 100 },
];

/** Run the complete two-phase recipe and return its final morphogen fields. */
export function reticulateField(size = 100, seed = 1): Field {
  const random = rng(seed);
  let field = seedField(size, random);
  for (const phase of RETICULATE_PHASES) field = runPhase(field, phase, random);
  return field;
}

/**
 * Convert morphogen B into an 8-bit coverage mask of the reticulation.
 *
 * The reference colour ramp is bright only at the very bottom of B's range.
 * The visible net is therefore the thin low-B set, not half the field. Linear
 * inversion would fill the cells as well as their borders. This cutoff follows
 * the reference ramp, then smoothstep softens the mask edges.
 */
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
    const normalised = (b[i] - low) / span;
    const coverage = Math.max(0, 1 - normalised / NET_CUTOFF);
    out[i] = Math.round(255 * coverage * coverage * (3 - 2 * coverage));
  }
  return out;
}

/**
 * Approximate a Gaussian blur with three wrapped horizontal and vertical box
 * passes. Baking this into the asset avoids repainting a full-page CSS blur on
 * scroll, while wrapping preserves a seamless tile.
 */
export function blurMask(
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
