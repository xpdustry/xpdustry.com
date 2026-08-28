/**
 * The reticulate whipray (Himantura uarnak) pattern, as a bounded non-linear
 * Turing reaction-diffusion.
 *
 * Ported from Malheiros' reference implementation for "The leopard never
 * changes its spots" (SIGGRAPH 2020), specifically the whipray experiment.
 * Two phases: a first run at a high diffusion ratio settles into round spots,
 * then a second run at a lower ratio while the tissue grows underneath pulls
 * those spots into the open network that gives the ray its name.
 *
 * The convolution wraps, and growth only ever inserts duplicated rows and
 * columns, so the field stays periodic from end to end: the output tiles.
 */

/** The 3x3 discrete Laplacian both morphogens diffuse through. */
const KERNEL = [1, 4, 1, 4, -20, 4, 1, 4, 1].map((weight) => weight / 6);

export interface PhaseOptions {
  /** Diffusion ratio between the two morphogens: high spots, low reticulates. */
  ratio: number;
  /** Overall diffusion scale, i.e. how coarse the pattern comes out. */
  scale: number;
  /** Integration speed. 40 in the notebook; dt is 0.01 * speed / 100. */
  speed: number;
  /** Number of iterations to run. */
  steps: number;
  /** Lower clamp on B. Holding it above zero is what bounds the model. */
  floorB: number;
  /** Insert one row and one column every `growEvery` steps, if set. */
  growEvery?: number;
}

export interface Field {
  a: Float64Array;
  b: Float64Array;
  width: number;
  height: number;
}

/**
 * Mulberry32. The notebook seeds numpy; we only need *a* reproducible stream,
 * and matching numpy's Mersenne bit for bit would buy nothing — the pattern is
 * an attractor of the model, not of the noise.
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

/** The starting broth: A flat, B flat plus a hair of noise to break symmetry. */
export function seedField(size: number, random: () => number): Field {
  const cells = size * size;
  const a = new Float64Array(cells).fill(4);
  const b = new Float64Array(cells);
  for (let i = 0; i < cells; i += 1) b[i] = 4 + random();
  return { a, b, width: size, height: size };
}

/**
 * One wrapped convolution of `KERNEL` over `source`, the `mode='wrap'` half of
 * the notebook's `ndimage.convolve`.
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
 * Growth, the half of the paper that matters here: a new row and column of
 * tissue, each cell copied from a random point along its line so the existing
 * pattern is stretched rather than overwritten. Spots that were round drift
 * apart, and the reaction re-joins them as stripes.
 */
function grow(field: Field, random: () => number): Field {
  const { a, b, width, height } = field;
  const w = width + 1;
  const h = height + 1;
  const na = new Float64Array(w * h);
  const nb = new Float64Array(w * h);

  // Vertical first: copy the old field in, then push a random suffix of each
  // column down by one, which duplicates the row it was cut at.
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

/** Runs one phase of the model in place, returning the (possibly grown) field. */
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

/** The two phases the notebook runs for Himantura uarnak. */
export const RETICULATE_PHASES: readonly PhaseOptions[] = [
  { ratio: 30, scale: 3, speed: 40, steps: 4000, floorB: 2 },
  { ratio: 8, scale: 3, speed: 40, steps: 10000, floorB: 2, growEvery: 100 },
];

/** Where the notebook's ramp has finished crossing from teal to its ground. */
const NET_CUTOFF = 0.34;

/** Runs the whole recipe and hands back the final B field. */
export function reticulateField(size = 100, seed = 1): Field {
  const random = rng(seed);
  let field = seedField(size, random);
  for (const phase of RETICULATE_PHASES) field = runPhase(field, phase, random);
  return field;
}

/**
 * Turns the B field into an 8-bit coverage mask of the reticulation itself.
 *
 * The notebook colours B through a ramp that is teal only at the very bottom
 * of the range and near-black across the rest, so the net you see is the thin
 * low-B set, not half the field. A linear inversion would paint the cells as
 * well as the lines; this reproduces the ramp's own falloff, and smoothsteps
 * it so the edges stay as soft on screen as they are in the plot.
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
 * Softens a mask with three wrapped box passes, which is close enough to a
 * Gaussian for this and cheap enough to run on every pixel.
 *
 * Doing it here rather than with a CSS filter matters: `filter: blur()` on a
 * full-width background is a per-frame paint the compositor redoes on scroll,
 * and the whole point of baking the tile is that the page does no such work.
 * Wrapping keeps the tile seamless.
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
