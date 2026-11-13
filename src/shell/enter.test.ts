import { runInNewContext } from "node:vm";
import { describe, expect, test, vi } from "vitest";
import { ENTER } from "./enter";

class HTMLImageElement {}

function texture(kind: string, top = 20) {
  const animation = {
    pause: vi.fn(),
    play: vi.fn(),
    cancel: vi.fn(),
    effect: { updateTiming: vi.fn() }
  };
  return {
    animation,
    element: {
      dataset: { texture: kind },
      closest: () => null,
      getBoundingClientRect: () => ({ top, bottom: top + 80 }),
      animate: vi.fn((_frames: Keyframe[], _options: KeyframeAnimationOptions) => ({
        ...animation
      }))
    }
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
  decode?: () => Promise<void>;
  textures?: ReturnType<typeof texture>[];
} = {}) {
  const root = { dataset: {} as Record<string, string>, animate() {} };
  const addEventListener = vi.fn();
  class Image {
    src = "";
    decode = decode;
  }
  return {
    root,
    addEventListener,
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
      getComputedStyle: () => ({ backgroundImage: 'url("/assets/crown.webp")' }),
      performance: { now: () => 0 },
      HTMLImageElement,
      Image,
      innerHeight: 800
    }
  };
}

describe("inline texture entrance", () => {
  test("holds textures from the head and hands them to their animations once parsed", () => {
    const { context, root, addEventListener } = browser({ loading: true });
    runInNewContext(ENTER, context);
    expect(root.dataset).toHaveProperty("enter");
    addEventListener.mock.calls.find(([event]) => event === "DOMContentLoaded")![1]();
    expect(root.dataset).not.toHaveProperty("enter");
  });

  test("plays the first screen's textures once their images decode, and leaves the rest", async () => {
    const shown = texture("backdrop");
    const below = texture("grow", 1200);
    runInNewContext(ENTER, browser({ textures: [shown, below] }).context);
    expect(below.element.animate).not.toHaveBeenCalled();
    const layers = shown.element.animate.mock.calls.map(([, options]) => options.pseudoElement);
    expect(layers).toEqual(["::before", "::after"]);
    expect(shown.animation.pause).toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve));
    expect(shown.animation.play).toHaveBeenCalledTimes(2);
  });

  test("grows a blob in through threads at the scale of its own labyrinth", () => {
    const blob = texture("grow");
    Object.assign(blob.element.dataset, { tile: "108" });
    runInNewContext(ENTER, browser({ textures: [blob] }).context);
    const [frames] = blob.element.animate.mock.calls[0]!;
    expect(frames.at(-1)).toMatchObject({ maskSize: expect.stringContaining("108px 108px") });
  });

  test("starts the sequence when parsed, even after a slow document", async () => {
    const shown = texture("backdrop");
    const { context, addEventListener } = browser({ loading: true, textures: [shown] });
    runInNewContext(ENTER, context);
    context.performance.now = () => 500;
    addEventListener.mock.calls.find(([event]) => event === "DOMContentLoaded")![1]();
    await new Promise((done) => setTimeout(done));
    expect(shown.animation.effect.updateTiming.mock.calls).toEqual([
      [{ delay: 80 }],
      [{ delay: 220 }]
    ]);
  });

  test("keeps the backdrop's layers apart even when their images are late", async () => {
    const shown = texture("backdrop");
    const { context } = browser({ textures: [shown] });
    runInNewContext(ENTER, context);
    context.performance.now = () => 500;
    await new Promise((done) => setTimeout(done));
    expect(shown.animation.effect.updateTiming.mock.calls).toEqual([
      [{ delay: 0 }],
      [{ delay: 140 }]
    ]);
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
    await new Promise((done) => setTimeout(done));
    expect(shown.animation.play).not.toHaveBeenCalled();
  });

  test("a stalled module cannot hold textures until DOMContentLoaded", () => {
    const shown = texture("drop");
    const { context, root, addEventListener } = browser({ loading: true, textures: [shown] });
    runInNewContext(ENTER, context);
    context.setTimeout.mock.calls[0]![0]();
    expect(root.dataset).not.toHaveProperty("enter");
    addEventListener.mock.calls.find(([event]) => event === "DOMContentLoaded")![1]();
    expect(shown.element.animate).not.toHaveBeenCalled();
  });

  test("leaves no waiting animation in a back navigation snapshot", () => {
    const shown = texture("drop");
    const { context, root, addEventListener } = browser({ textures: [shown] });
    runInNewContext(ENTER, context);
    addEventListener.mock.calls.find(([event]) => event === "pagehide")![1]();
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
