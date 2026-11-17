import { runInNewContext } from "node:vm";
import { describe, expect, test, vi, type Mock } from "vitest";
import { ENTER } from "./enter";

interface FakeAnimation {
  pause: Mock<() => void>;
  play: Mock<() => void>;
  cancel: Mock<() => void>;
  effect: {
    updateTiming: Mock<(timing: OptionalEffectTiming) => void>;
    setKeyframes: Mock<(frames: Keyframe[]) => void>;
  };
}

function fakeAnimation(every?: FakeAnimation): FakeAnimation {
  return {
    pause: vi.fn(() => every?.pause()),
    play: vi.fn(() => every?.play()),
    cancel: vi.fn(() => every?.cancel()),
    effect: {
      updateTiming: vi.fn((timing: OptionalEffectTiming) => every?.effect.updateTiming(timing)),
      setKeyframes: vi.fn((frames: Keyframe[]) => every?.effect.setKeyframes(frames))
    }
  };
}

function texture(kind: string, top = 20) {
  const animation = fakeAnimation();
  const layers = new Map<string | null | undefined, FakeAnimation>();
  return {
    animation,
    layers,
    element: {
      dataset: { texture: kind } as Record<string, string>,
      closest: () => null,
      getBoundingClientRect: () => ({ top, bottom: top + 80 }),
      animate: vi.fn((_frames: Keyframe[], options: KeyframeAnimationOptions) => {
        const layer = fakeAnimation(animation);
        layers.set(options.pseudoElement, layer);
        return layer;
      })
    }
  };
}

const playing = ({ layers }: ReturnType<typeof texture>) =>
  [...layers].filter(([, layer]) => layer.play.mock.calls.length > 0).map(([name]) => name);

const delays = ({ layers }: ReturnType<typeof texture>) =>
  Object.fromEntries(
    [...layers].map(([name, layer]) => [
      name,
      layer.effect.updateTiming.mock.calls.map(([timing]) => timing)
    ])
  );

function images() {
  const pending = new Map<string, PromiseWithResolvers<void>>();
  const image = (src: string) => {
    if (!pending.has(src)) pending.set(src, Promise.withResolvers<void>());
    return pending.get(src)!;
  };
  return {
    decode: (src: string) => image(src).promise,
    ready: (src: string) => image(src).resolve()
  };
}

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
    context: {
      document: {
        documentElement: root,
        readyState: loading ? "loading" : "complete",
        querySelectorAll: () => textures.map(({ element }) => element)
      },
      addEventListener,
      setTimeout: vi.fn(),
      clearTimeout: vi.fn(),
      matchMedia: () => ({ matches: !reduced }),
      paints: (key: string) => Promise.resolve(`blob:${key}`),
      performance: { now: () => 0 },
      Image,
      innerHeight: 800
    }
  };
}

const settled = () => new Promise((done) => setTimeout(done));

describe("inline texture entrance", () => {
  test("holds textures from the head and hands them to their animations once parsed", () => {
    const { context, root, parsed } = browser({ loading: true });
    runInNewContext(ENTER, context);
    expect(root.dataset).toHaveProperty("enter");
    parsed();
    expect(root.dataset).not.toHaveProperty("enter");
  });

  test("plays the first screen's textures once they are painted, and leaves the rest", async () => {
    const shown = texture("backdrop");
    const below = texture("grow", 1200);
    runInNewContext(ENTER, browser({ textures: [shown, below] }).context);
    expect(below.element.animate).not.toHaveBeenCalled();
    const layers = shown.element.animate.mock.calls.map(([, options]) => options.pseudoElement);
    expect(layers).toEqual(["::before", "::after"]);
    expect(shown.animation.pause).toHaveBeenCalled();
    await settled();
    expect(shown.animation.play).toHaveBeenCalledTimes(2);
  });

  test("grows a blob in through threads at the scale of its own labyrinth", async () => {
    const blob = texture("grow");
    Object.assign(blob.element.dataset, { tile: "108" });
    runInNewContext(ENTER, browser({ textures: [blob] }).context);
    expect(blob.element.animate.mock.calls[0]![0]).toEqual([{ opacity: 0 }, { opacity: 1 }]);
    await settled();
    const [frames] = blob.animation.effect.setKeyframes.mock.calls[0]!;
    expect(frames.at(-1)).toMatchObject({
      maskImage: expect.stringContaining('url("blob:threads")'),
      maskSize: expect.stringContaining("108px 108px")
    });
  });

  test("waits for each texture's own image: a sprite's by its key, the frame's by name", async () => {
    const blob = texture("grow");
    Object.assign(blob.element.dataset, { paint: "blob_a" });
    const page = browser({ textures: [texture("drop"), texture("backdrop"), blob] });
    const paints = vi.fn(page.context.paints);
    runInNewContext(ENTER, { ...page.context, paints });
    await settled();
    expect(paints.mock.calls.map(([key]) => key).sort()).toEqual(
      ["threads", "crown", "backdrop-far", "backdrop-near", "blob_a"].sort()
    );
  });

  test.each([
    ["backdrop-far", "::before", "backdrop-near", "::after"],
    ["backdrop-near", "::after", "backdrop-far", "::before"]
  ])(
    "plays each backdrop layer once its own image is ready: %s, the %s layer",
    async (first, firstLayer, second, secondLayer) => {
      const shown = texture("backdrop");
      const { decode, ready } = images();
      runInNewContext(ENTER, browser({ textures: [shown], decode }).context);

      ready(`blob:${first}`);
      await settled();
      expect(playing(shown)).toEqual([firstLayer]);

      ready(`blob:${second}`);
      await settled();
      expect(new Set(playing(shown))).toEqual(new Set([firstLayer, secondLayer]));
    }
  );

  test("a texture that cannot be painted still takes its turn, and holds nothing", async () => {
    const shown = texture("drop");
    const { context } = browser({ textures: [shown] });
    runInNewContext(ENTER, { ...context, paints: () => Promise.resolve(undefined) });
    await settled();
    expect(shown.animation.play).toHaveBeenCalledOnce();
    runInNewContext(ENTER, { ...context, paints: undefined });
    await settled();
    expect(shown.animation.play).toHaveBeenCalledTimes(2);
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
    expect(blob.animation.effect.setKeyframes).not.toHaveBeenCalled();
    expect(blob.animation.effect.updateTiming).toHaveBeenCalledWith(
      expect.objectContaining({ duration: 350 })
    );
    expect(blob.animation.play).toHaveBeenCalledOnce();
  });

  test("starts the sequence when parsed, even after a slow document", async () => {
    const shown = texture("backdrop");
    const { context, parsed } = browser({ loading: true, textures: [shown] });
    runInNewContext(ENTER, context);
    context.performance.now = () => 500;
    parsed();
    await settled();
    expect(delays(shown)).toEqual({ "::before": [{ delay: 80 }], "::after": [{ delay: 220 }] });
  });

  test("keeps the backdrop's layers apart even when their images are late", async () => {
    const shown = texture("backdrop");
    const { context } = browser({ textures: [shown] });
    runInNewContext(ENTER, context);
    context.performance.now = () => 500;
    await settled();
    expect(delays(shown)).toEqual({ "::before": [{ delay: 0 }], "::after": [{ delay: 140 }] });
  });

  test("leaves unknown kinds to paint with the page", () => {
    const other = texture("fade");
    runInNewContext(ENTER, browser({ textures: [other] }).context);
    expect(other.element.animate).not.toHaveBeenCalled();
  });

  test("respects reduced motion", () => {
    const shown = texture("drop");
    const { context, root } = browser({ reduced: true, textures: [shown] });
    runInNewContext(ENTER, context);
    expect(root.dataset).not.toHaveProperty("enter");
    expect(shown.element.animate).not.toHaveBeenCalled();
  });

  test("releases stalled images and ignores decoding after the deadline", async () => {
    let decoded = () => {};
    const image = new Promise<void>((done) => {
      decoded = done;
    });
    const shown = texture("grow");
    const { context, root } = browser({ textures: [shown], decode: () => image });
    runInNewContext(ENTER, context);
    const [release, delay] = context.setTimeout.mock.calls[0]!;
    expect(delay).toBe(4000);
    release();
    expect(root.dataset).not.toHaveProperty("enter");
    expect(shown.animation.cancel).toHaveBeenCalledOnce();
    decoded();
    await settled();
    expect(shown.animation.play).not.toHaveBeenCalled();
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
    expect(shown.animation.cancel).toHaveBeenCalledOnce();
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
