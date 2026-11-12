// Living blobs. Each blob of a card's texture is a little colony of metaballs: on its own random
// rhythm a colony scatters, its cells drifting outward as small blobs that fray into labyrinth, then
// regroups into one lumpy blob. Colonies roam a little, and now and then a cell leaves one colony
// and crawls across the card to join another.
//
// A texture starts as exactly its static image (every cell stacked on its blob at 1/k weight) and
// comes alive over 4 s. Every frame is `renderTexture`'s maths in one WebGL2 shader on a shared
// OffscreenCanvas: the CPU only steps a few dozen cells and sets uniforms, and each card's canvas
// takes the frame as an ImageBitmap without a copy. The domain warp never moves, so it is baked
// once per card size into a texture. Only cards on screen animate. Without WebGL2, or with reduced
// motion, the textures stay still.

import type { TextureSettings } from "#app/data/textures";
import { makeNoise, parseHex, resolve, smoothstep } from "#app/lib/reticulate/field";
import { loadLabyrinth } from "#app/lib/reticulate/labyrinth";

const MAX_CELLS = 96;

const VERTEX = `#version 300 es
void main() { vec2 p = vec2(gl_VertexID & 1, gl_VertexID >> 1) * 4. - 1.; gl_Position = vec4(p, 0, 1); }`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D labyrinth, warp;
uniform vec2 size, grid;
uniform float tile, n, ar, hard, reach, bias, soft, base, inner;
uniform vec4 col, inn, cells[${MAX_CELLS}];
uniform int count;
out vec4 o;
void main() {
  vec2 p = vec2(gl_FragCoord.x - .5, size.y - gl_FragCoord.y - .5), uv = p / size;  // top-down, like renderTexture
  vec2 w = uv + texture(warp, (p / 8. + .5) / grid).rg;
  float b = 0.;
  for (int i = 0; i < ${MAX_CELLS}; i++) {
    if (i >= count) break;
    vec4 k = cells[i];
    b += k.w * exp(-pow(length(vec2((w.x - k.x) * ar, w.y - k.y)) / k.z, hard));
  }
  float r = texture(labyrinth, p / tile + .5 / n).r, f = r * min(1., base + b * reach) + b * .9;
  float a = smoothstep(bias - soft, bias + soft, f);
  float lt = smoothstep(.42, .58, r), lc = clamp((b - .62) / .25, 0., 1.);
  vec4 c = mix(col, inn, inner * lt * lc);
  o = vec4(c.rgb, 1) * c.a * a;
}`;

/** How far a colony's centre wanders, in card heights. */
const ROAM = 0.14;
/** How far a scattered colony's cells spread, in blob radii. */
const SCATTER = 1.5;
/** A cell's radius, in blob radii. */
const CELL_SIZE = 0.8;
/** Top cell speed, in card heights per second. */
const SPEED = 0.22;
/** Seconds between cells changing colony, per card. */
const TRADE = 18;

interface Colony {
  x: number;
  y: number;
  r: number;
  w: number;
  seed: number;
  noise: ReturnType<typeof makeNoise>;
  mood: number;
}

interface Cell {
  colony: number;
  offset: [number, number];
  velocity: [number, number];
  r: number;
  w: number;
  angle: number;
  spin: number;
  lump: number;
  far: number;
  phase: number;
}

interface Entry {
  still: HTMLElement;
  live: HTMLCanvasElement;
  context: ImageBitmapRenderingContext;
  settings: ReturnType<typeof resolve>;
  colonies: Colony[];
  cells: Cell[];
  perColony: number;
  /** Solo textures keep each blob whole: it only roams and breathes. */
  solo: boolean;
  t: number;
  visible: boolean;
  width: number;
  height: number;
  warp?: WebGLTexture;
  grid: [number, number];
}

const random = (min: number, max: number) => min + Math.random() * (max - min);

function createEntry(
  still: HTMLElement,
  live: HTMLCanvasElement,
  settings: TextureSettings,
  solo: boolean,
): Entry {
  const resolved = resolve(settings);
  // k cells per colony, fewer when a texture has many blobs
  const perColony = solo
    ? 1
    : Math.max(1, Math.min(8, Math.floor((MAX_CELLS * 0.75) / resolved.blobs.length)));
  const colonies = resolved.blobs.map(([x, y, r, w]) => ({
    x,
    y,
    r,
    w,
    seed: random(0, 1e3),
    noise: makeNoise((Math.random() * 1e6) | 0),
    mood: 0,
  }));
  const cells = colonies.flatMap((colony, index) =>
    Array.from({ length: perColony }, (_, j): Cell => ({
      colony: index,
      offset: [0, 0],
      velocity: [0, 0],
      r: colony.r,
      w: colony.w / perColony,
      angle: (j / perColony) * 6.283 + random(-0.6, 0.6),
      spin: random(0.06, 0.22) * (Math.random() < 0.5 ? -1 : 1),
      lump: random(0.15, 0.35),
      far: random(0.6, 1),
      phase: random(0, 6.3),
    })),
  );
  return {
    still,
    live,
    context: live.getContext("bitmaprenderer")!,
    settings: resolved,
    colonies,
    cells,
    perColony,
    solo,
    t: 0,
    visible: false,
    width: 0,
    height: 0,
    grid: [1, 1],
  };
}

/** One step of a texture's colonies; positions are in card heights, offsets from each colony's centre. */
function step(entry: Entry, dt: number, aspect: number): number[] {
  const t = (entry.t += dt);
  const wake = smoothstep(0, 4, t);
  const centres = entry.colonies.map((colony) => {
    const n = colony.noise;
    // mood: 0 gathered, 1 scattered, drifting through both every 20-40 s
    colony.mood = smoothstep(0.38, 0.68, n(t * 0.045 + colony.seed, 0, 2)) * wake;
    const roam = ROAM * (entry.solo ? 1 : 2) * wake;
    return [
      colony.x * aspect + roam * (n(t * 0.03, colony.seed + 9, 2) - 0.5),
      colony.y + roam * (n(t * 0.03, colony.seed + 19, 2) - 0.5),
    ] as const;
  });

  // now and then a cell leaves the busiest colony for another one, and crawls over
  if (!entry.solo && entry.colonies.length > 1 && t > 6 && Math.random() < dt / TRADE) {
    const sizes = entry.colonies.map(
      (_, index) => entry.cells.filter((cell) => cell.colony === index).length,
    );
    const from = sizes.indexOf(Math.max(...sizes));
    const to = (from + 1 + ((Math.random() * (sizes.length - 1)) | 0)) % sizes.length;
    const pool = entry.cells.filter((cell) => cell.colony === from);
    if (pool.length > 1 && sizes[to]! < entry.perColony + 2) {
      const cell = pool[(Math.random() * pool.length) | 0]!;
      cell.offset = [
        centres[from]![0] + cell.offset[0] - centres[to]![0],
        centres[from]![1] + cell.offset[1] - centres[to]![1],
      ];
      cell.colony = to;
    }
  }

  for (const cell of entry.cells) {
    const colony = entry.colonies[cell.colony]!;
    const mood = colony.mood;
    cell.angle += cell.spin * dt;
    // gathered, cells huddle into a lumpy blob; scattered, they spread out, shrinking a touch
    const reach = entry.solo
      ? 0
      : colony.r * ((1 - mood) * cell.lump + mood * SCATTER * cell.far) * wake;
    const tx = Math.cos(cell.angle) * reach;
    const ty = Math.sin(cell.angle) * reach;
    cell.velocity[0] += ((tx - cell.offset[0]) * 2.4 - cell.velocity[0] * 2) * dt;
    cell.velocity[1] += ((ty - cell.offset[1]) * 2.4 - cell.velocity[1] * 2) * dt;
    const speed = Math.hypot(...cell.velocity);
    if (speed > SPEED) {
      cell.velocity[0] *= SPEED / speed;
      cell.velocity[1] *= SPEED / speed;
    }
    cell.offset[0] += cell.velocity[0] * dt;
    cell.offset[1] += cell.velocity[1] * dt;
    // radius and weight start as the stacked static blob (r, w / k) and settle to a cell's own
    const breathe = 1 + 0.08 * Math.sin(t * 0.5 + cell.phase);
    const wantR =
      colony.r * (wake * (entry.solo ? 1 : CELL_SIZE * (1 - 0.1 * mood)) * breathe + (1 - wake));
    const wantW = colony.w * (wake + (1 - wake) / entry.perColony);
    const ease = t < 4 ? 1 : 1 - Math.exp(-dt / 2);
    cell.r += (wantR - cell.r) * ease;
    cell.w += (wantW - cell.w) * ease;
  }

  return entry.cells.flatMap((cell) => {
    const centre = centres[cell.colony]!;
    return [
      (centre[0] + cell.offset[0]) / aspect,
      centre[1] + cell.offset[1],
      Math.max(0.01, cell.r),
      cell.w,
    ];
  });
}

class Drift {
  readonly #canvas: OffscreenCanvas;
  readonly #gl: WebGL2RenderingContext;
  readonly #program: WebGLProgram;
  readonly #uniforms = new Map<string, WebGLUniformLocation | null>();
  readonly #entries = new Set<Entry>();
  readonly #observer: IntersectionObserver;
  #frame = 0;
  #last = 0;
  #ready = false;

  static create(): Drift | undefined {
    if (typeof OffscreenCanvas === "undefined") return undefined;
    const canvas = new OffscreenCanvas(1, 1);
    const gl = canvas.getContext("webgl2", { antialias: false, depth: false });
    return gl ? new Drift(canvas, gl) : undefined;
  }

  private constructor(canvas: OffscreenCanvas, gl: WebGL2RenderingContext) {
    this.#canvas = canvas;
    this.#gl = gl;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };
    this.#program = gl.createProgram();
    gl.attachShader(this.#program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(this.#program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(this.#program);
    if (!gl.getProgramParameter(this.#program, gl.LINK_STATUS)) {
      throw new Error(`drift shader: ${gl.getProgramInfoLog(this.#program)}`);
    }
    gl.useProgram(this.#program);

    this.#observer = new IntersectionObserver(
      (records) => {
        for (const record of records) {
          for (const entry of this.#entries) {
            if (entry.still === record.target) entry.visible = record.isIntersecting;
          }
        }
        this.#kick();
      },
      { rootMargin: "64px" },
    );

    void loadLabyrinth().then(({ data, size }) => {
      gl.uniform1i(this.#uniform("labyrinth"), 0);
      gl.uniform1i(this.#uniform("warp"), 1);
      gl.uniform1f(this.#uniform("n"), size);
      this.#texture(0, size, size, gl.RED, gl.R16F, data);
      this.#ready = true;
      this.#kick();
    });
  }

  attach(still: HTMLElement, live: HTMLCanvasElement, settings: TextureSettings, solo: boolean) {
    const entry = createEntry(still, live, settings, solo);
    this.#entries.add(entry);
    this.#observer.observe(still);
    return () => {
      this.#entries.delete(entry);
      this.#observer.unobserve(still);
      if (entry.warp) this.#gl.deleteTexture(entry.warp);
    };
  }

  #uniform(name: string): WebGLUniformLocation | null {
    if (!this.#uniforms.has(name)) {
      this.#uniforms.set(name, this.#gl.getUniformLocation(this.#program, name));
    }
    return this.#uniforms.get(name)!;
  }

  #texture(
    unit: number,
    width: number,
    height: number,
    format: number,
    internal: number,
    data: Float32Array,
  ): WebGLTexture {
    const gl = this.#gl;
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, width, height, 0, format, gl.FLOAT, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const wrap = unit ? gl.CLAMP_TO_EDGE : gl.REPEAT;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    return texture;
  }

  /** `renderTexture`'s domain warp, sampled every 8 px; it depends only on the card's size. */
  #bakeWarp(entry: Entry): void {
    const { width: w, height: h, settings } = entry;
    const aspect = w / h;
    const k = settings.warp * 0.5;
    const warpX = makeNoise(settings.seed);
    const warpY = makeNoise(settings.seed + 1);
    const gw = Math.ceil(w / 8) + 1;
    const gh = Math.ceil(h / 8) + 1;
    const data = new Float32Array(gw * gh * 2);
    for (let j = 0; j < gh; j++) {
      for (let i = 0; i < gw; i++) {
        const u = (i * 8) / w;
        const v = (j * 8) / h;
        const at = (j * gw + i) * 2;
        data[at] = k * (warpX(u * 2.1 * aspect, v * 2.1, 3) - 0.5);
        data[at + 1] = k * (warpY(u * 2.1 * aspect, v * 2.1, 3) - 0.5);
      }
    }
    if (entry.warp) this.#gl.deleteTexture(entry.warp);
    entry.warp = this.#texture(1, gw, gh, this.#gl.RG, this.#gl.RG16F, data);
    entry.grid = [gw, gh];
  }

  #kick(): void {
    if (this.#ready && !this.#frame) this.#frame = requestAnimationFrame(this.#draw);
  }

  readonly #draw = (now: number): void => {
    const gl = this.#gl;
    const dt = Math.min(0.1, (now - (this.#last || now)) / 1000);
    this.#last = now;

    for (const entry of this.#entries) {
      if (!entry.visible) continue;
      const rect = entry.still.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (!w || !h) continue;
      if (w !== entry.width || h !== entry.height) {
        entry.width = w;
        entry.height = h;
        this.#bakeWarp(entry);
      }
      if (this.#canvas.width !== w || this.#canvas.height !== h) {
        this.#canvas.width = w;
        this.#canvas.height = h;
      }
      gl.viewport(0, 0, w, h);

      const s = entry.settings;
      const aspect = w / h;
      const cells = step(entry, dt, aspect);
      const rgba = (color: string) => parseHex(color).map((value) => value / 255);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, entry.warp!);
      gl.uniform2f(this.#uniform("size"), w, h);
      gl.uniform2f(this.#uniform("grid"), ...entry.grid);
      gl.uniform1f(this.#uniform("tile"), s.tile);
      gl.uniform1f(this.#uniform("ar"), aspect);
      gl.uniform1f(this.#uniform("hard"), s.hard);
      gl.uniform1f(this.#uniform("reach"), s.reach);
      gl.uniform1f(this.#uniform("bias"), s.bias);
      gl.uniform1f(this.#uniform("soft"), s.soft);
      gl.uniform1f(this.#uniform("base"), s.base);
      gl.uniform4fv(this.#uniform("col"), rgba(s.color));
      gl.uniform4fv(this.#uniform("inn"), rgba(s.inner ?? s.color));
      gl.uniform1f(this.#uniform("inner"), s.inner ? 1 : 0);
      gl.uniform4fv(this.#uniform("cells[0]"), cells.slice(0, MAX_CELLS * 4));
      gl.uniform1i(this.#uniform("count"), Math.min(MAX_CELLS, entry.cells.length));
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (entry.live.width !== w || entry.live.height !== h) {
        entry.live.width = w;
        entry.live.height = h;
      }
      entry.context.transferFromImageBitmap(this.#canvas.transferToImageBitmap());
      if (!entry.live.dataset.running) {
        entry.live.dataset.running = "";
        entry.still.style.visibility = "hidden";
      }
    }

    const anyVisible = [...this.#entries].some((entry) => entry.visible);
    this.#frame = anyVisible ? requestAnimationFrame(this.#draw) : 0;
    if (!anyVisible) this.#last = 0;
  };
}

let drift: Drift | null | undefined;

/**
 * Brings a texture's blobs to life on `live`, a canvas laid over `still`. Returns the detach.
 * Does nothing under reduced motion, without WebGL2, or for textures without blobs.
 */
export function attachDrift(
  still: HTMLElement,
  live: HTMLCanvasElement,
  settings: TextureSettings,
  solo = false,
): () => void {
  if (!settings.blobs?.length || settings.wave || settings.repeat) return () => {};
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  if (drift === undefined) {
    try {
      drift = Drift.create() ?? null;
    } catch (error) {
      console.warn(error);
      drift = null;
    }
  }
  return drift?.attach(still, live, settings, solo) ?? (() => {});
}
