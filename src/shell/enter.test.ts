import { runInNewContext } from "node:vm";
import { describe, expect, test, vi } from "vitest";
import { ENTER } from "./enter";

/** What the entrance did to one layer's animation. */
interface Layer {
  timings: OptionalEffectTiming[];
  keyframes?: Keyframe[];
  plays: number;
  finishes: number;
  cancels: number;
}

interface Card {
  getBoundingClientRect: () => { top: number; bottom: number };
}

const card = (): Card => ({ getBoundingClientRect: () => ({ top: 20, bottom: 300 }) });

function texture(kind: string, top = 20, inCard: Card | null = null) {
  const layers = new Map<string, Layer>();
  return {
    layers,
    /** The one layer of a kind that has one. */
    layer: () => [...layers.values()][0]!,
    element: {
      dataset: { texture: kind } as Record<string, string>,
      closest: () => inCard,
      querySelectorAll: () => [] as { dataset: { paint: string } }[],
      getBoundingClientRect: () => ({ top, bottom: top + 80 }),
      animate: vi.fn((_frames: Keyframe[], { pseudoElement = "" }: KeyframeAnimationOptions) => {
        const layer: Layer = { timings: [], plays: 0, finishes: 0, cancels: 0 };
        layers.set(pseudoElement ?? "", layer);
        let playState = "running";
        return {
          get playState() {
            return playState;
          },
          pause: () => void (playState = "paused"),
          play: () => void (layer.plays++, (playState = "running")),
          finish: () => void (layer.finishes++, (playState = "finished")),
          cancel: () => void layer.cancels++,
          effect: {
            updateTiming: (timing: OptionalEffectTiming) => layer.timings.push(timing),
            setKeyframes: (frames: Keyframe[]) => (layer.keyframes = frames)
          }
        };
      })
    }
  };
}

const delays = ({ layers }: ReturnType<typeof texture>) =>
  Object.fromEntries([...layers].map(([name, layer]) => [name, layer.timings]));

function browser({
  loading = false,
  reduced = false,
  decode = () => Promise.resolve(),
  textures = [texture("drop")]
}: {
  loading?: boolean;
  reduced?: boolean;
  decode?: (src: string) => Promise<void>;
  textures?: ReturnType<typeof texture>[];
} = {}) {
  const root = { dataset: {} as Record<string, string>, animate() {} };
  const motion = { matches: !reduced, addEventListener: vi.fn() };
  const addEventListener = vi.fn();
  const on = (event: string) => addEventListener.mock.calls.find(([name]) => name === event)![1]();
  class Image {
    src = "";
    decode = () => decode(this.src);
  }
  return {
    root,
    parsed: () => on("DOMContentLoaded"),
    leave: () => on("pagehide"),
    lessMotion: () => {
      motion.matches = false;
      for (const [, changed] of motion.addEventListener.mock.calls) changed();
    },
    context: {
      document: {
        documentElement: root,
        readyState: loading ? "loading" : "complete",
        querySelectorAll: () => textures.map(({ element }) => element)
      },
      addEventListener,
      setTimeout: vi.fn(),
      clearTimeout: vi.fn(),
      matchMedia: () => motion,
      paints: (key: string) => Promise.resolve(`blob:${key}`),
      performance: { now: () => 0 },
      Image,
      innerHeight: 800
    }
  };
}

const settled = () => new Promise((done) => setTimeout(done));

describe("inline texture entrance", () => {
  test("waits for each texture's own image: a sprite's by its key, the frame's by name, each backdrop layer its own", async () => {
    const blob = texture("grow");
    Object.assign(blob.element.dataset, { paint: "blob_a" });
    const backdrop = texture("backdrop");
    const far = Promise.withResolvers<void>();
    const near = Promise.withResolvers<void>();
    const late: Record<string, Promise<void>> = {
      "blob:backdrop-far": far.promise,
      "blob:backdrop-near": near.promise
    };
    const page = browser({
      textures: [texture("drop"), backdrop, blob],
      decode: (src) => late[src] ?? Promise.resolve()
    });
    const paints = vi.fn(page.context.paints);
    runInNewContext(ENTER, { ...page.context, paints });
    await settled();
    expect(paints.mock.calls.map(([key]) => key).sort()).toEqual(
      ["threads", "crown", "backdrop-far", "backdrop-near", "blob_a"].sort()
    );
    const played = () => [...backdrop.layers].map(([pseudo, { plays }]) => `${pseudo} ${plays}`);
    expect(played()).toEqual(["::before 0", "::after 0"]);
    expect(blob.layer().plays).toBe(1);

    near.resolve();
    await settled();
    expect(played()).toEqual(["::before 0", "::after 1"]);
    far.resolve();
    await settled();
    expect(played()).toEqual(["::before 1", "::after 1"]);
  });

  test("a face waits for both of its edges, and rests without moving when one cannot be painted", async () => {
    const face = texture("face");
    face.element.querySelectorAll = () => [{ dataset: { paint: "ridge_a" } }];
    const fringe = Promise.withResolvers<void>();
    const { context } = browser({
      textures: [face],
      decode: (src) => (src === "blob:fringe" ? fringe.promise : Promise.resolve())
    });
    const paints = vi.fn(context.paints);
    runInNewContext(ENTER, { ...context, paints });
    await settled();
    expect(paints.mock.calls.map(([key]) => key)).toEqual(
      expect.arrayContaining(["ridge_a", "fringe"])
    );
    expect(face.layer().plays).toBe(0);
    expect(face.element.dataset).toHaveProperty("held");
    fringe.resolve();
    await settled();
    expect(face.layer().plays).toBe(1);
    expect(face.element.dataset).not.toHaveProperty("held");

    const unpainted = texture("face");
    runInNewContext(ENTER, {
      ...browser({ textures: [unpainted] }).context,
      paints: () => Promise.resolve(undefined)
    });
    await settled();
    expect(unpainted.layer()).toMatchObject({ plays: 0, finishes: 1 });
    expect(unpainted.element.dataset).not.toHaveProperty("held");
  });

  test("asking for less motion mid-entrance rests what moves and what has yet to", async () => {
    const moving = texture("drop");
    const late = texture("grow");
    Object.assign(late.element.dataset, { paint: "blob_late" });
    const image = Promise.withResolvers<void>();
    const page = browser({
      textures: [moving, late],
      decode: (src) => (src === "blob:blob_late" ? image.promise : Promise.resolve())
    });
    runInNewContext(ENTER, page.context);
    await settled();
    expect(moving.layer()).toMatchObject({ plays: 1, finishes: 0 });
    page.lessMotion();
    expect(moving.layer().finishes).toBe(1);
    image.resolve();
    await settled();
    expect(late.layer()).toMatchObject({ plays: 0, finishes: 1 });
  });

  test("a texture that cannot be painted, or has no painter, still takes its turn", async () => {
    const shown = texture("drop");
    const { context } = browser({ textures: [shown] });
    for (const paints of [() => Promise.resolve(undefined), undefined]) {
      runInNewContext(ENTER, { ...context, paints });
      await settled();
      expect(shown.layer().plays).toBe(1);
    }
  });

  test("a missing thread mask uses a fade as soon as the blob is ready", async () => {
    const blob = texture("grow");
    const { context } = browser({
      textures: [blob],
      decode: (src) =>
        src.includes("threads") ? Promise.reject(new Error("missing")) : Promise.resolve()
    });
    runInNewContext(ENTER, context);
    await settled();
    expect(blob.layer().keyframes).toBeUndefined();
    expect(blob.layer().plays).toBe(1);
    expect(blob.layer().timings).toContainEqual(expect.objectContaining({ duration: 350 }));
  });

  test.each([
    ["when parsed, even after a slow document", true, 80, 220],
    ["its layers apart even when their images are late", false, 0, 140]
  ])("starts the backdrop %s", async (_label, loading, far, near) => {
    const shown = texture("backdrop");
    const { context, parsed } = browser({ loading, textures: [shown] });
    runInNewContext(ENTER, context);
    context.performance.now = () => 500;
    if (loading) parsed();
    await settled();
    expect(delays(shown)).toEqual({ "::before": [{ delay: far }], "::after": [{ delay: near }] });
  });

  test("staggers the cards, then each card's first blobs, and a grown blob shares its blob's turn", async () => {
    const [first, second] = [card(), card()];
    const blobs = [
      texture("grow", 20, first),
      texture("grown", 20, first),
      ...Array.from({ length: 5 }, () => texture("grow", 20, first)),
      texture("grow", 20, second),
      texture("grown", 20, second)
    ];
    runInNewContext(ENTER, browser({ textures: blobs }).context);
    await settled();
    // Card by card, then blob by blob up to the fifth, a grown sprite on its blob's turn.
    const cards = [0, 0, 0, 0, 0, 0, 0, 1, 1];
    const turns = [0, 0, 1, 2, 3, 4, 4, 0, 0];
    expect(blobs.map((blob) => Object.values(delays(blob)))).toEqual(
      turns.map((turn, at) => [[{ delay: 220 + cards[at]! * 110 + turn * 70 }]])
    );
  });

  test("releases stalled images and ignores decoding after the deadline", async () => {
    const image = Promise.withResolvers<void>();
    const shown = texture("grow");
    const { context, root } = browser({ textures: [shown], decode: () => image.promise });
    runInNewContext(ENTER, context);
    const [release, delay] = context.setTimeout.mock.calls[0]!;
    expect(delay).toBe(4000);
    release();
    expect(root.dataset).not.toHaveProperty("enter");
    expect(shown.layer().cancels).toBe(1);
    image.resolve();
    await settled();
    expect(shown.layer().plays).toBe(0);
  });

  test("a stalled module cannot hold textures until DOMContentLoaded", () => {
    const shown = texture("drop");
    const { context, root, parsed } = browser({ loading: true, textures: [shown] });
    runInNewContext(ENTER, context);
    context.setTimeout.mock.calls[0]![0]();
    expect(root.dataset).not.toHaveProperty("enter");
    parsed();
    expect(shown.element.animate).not.toHaveBeenCalled();
  });

  test("leaves no waiting animation in a back navigation snapshot", () => {
    const shown = texture("drop");
    const { context, root, leave } = browser({ textures: [shown] });
    runInNewContext(ENTER, context);
    leave();
    expect(root.dataset).not.toHaveProperty("enter");
    expect(shown.layer().cancels).toBe(1);
  });

  test("animation errors and missing APIs cannot leave textures hidden", () => {
    const broken = texture("drop");
    broken.element.animate.mockImplementation(() => {
      throw new Error("Animation unavailable");
    });
    const { context, root } = browser({ textures: [broken] });
    expect(() => runInNewContext(ENTER, context)).not.toThrow();
    expect(root.dataset).not.toHaveProperty("enter");
    expect(() =>
      runInNewContext(ENTER, { document: { documentElement: {}, readyState: "complete" } })
    ).not.toThrow();
  });
});
