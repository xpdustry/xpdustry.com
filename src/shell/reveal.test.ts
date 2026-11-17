import { runInNewContext } from "node:vm";
import { describe, expect, test, vi } from "vitest";
import { REVEAL } from "./reveal";

const block = (top: number, broken = false) => ({
  getBoundingClientRect: () => ({ top, bottom: top + 80 }),
  animate: vi.fn((_frames: Keyframe[], _options: KeyframeAnimationOptions) => {
    if (broken) throw new Error("Animation unavailable");
  })
});

function page({ loading = false, reduced = false, blocks = [block(20)] } = {}) {
  const addEventListener = vi.fn();
  const parsed = () =>
    addEventListener.mock.calls.find(([event]) => event === "DOMContentLoaded")![1]();
  const context = {
    document: { readyState: loading ? "loading" : "complete", querySelectorAll: () => blocks },
    addEventListener,
    matchMedia: () => ({ matches: reduced }),
    innerHeight: 800
  };
  return { context, parsed, blocks };
}

const options = (shown: ReturnType<typeof block>) => shown.animate.mock.calls[0]?.[1];

describe("inline reveal", () => {
  test("slides in the blocks on the first screen, one shortly after another", () => {
    const { context, blocks } = page({
      blocks: [block(20), block(120), block(220), block(320), block(420)]
    });
    runInNewContext(REVEAL, context);
    const delays = blocks.map((shown) => Number(options(shown)?.delay));
    expect(delays).toEqual([...delays].sort((a, b) => a - b));
    expect(delays.at(-1)).toBeGreaterThan(delays[0]!);
    expect(Math.max(...delays)).toBeLessThanOrEqual(120);
  });

  test("moves a block a short way, briefly", () => {
    const { context, blocks } = page();
    runInNewContext(REVEAL, context);
    const [frames, { duration }] = blocks[0]!.animate.mock.calls[0]!;
    expect(frames[0]).not.toEqual(frames.at(-1));
    expect(duration).toBeGreaterThan(0);
    expect(duration).toBeLessThanOrEqual(1000);
  });

  test("never makes a block transparent, so content shows even if the animation stalls", () => {
    const { context, blocks } = page();
    runInNewContext(REVEAL, context);
    expect(JSON.stringify(blocks[0]!.animate.mock.calls)).not.toContain("opacity");
  });

  test("leaves the blocks below the first screen alone", () => {
    const below = block(1200);
    runInNewContext(REVEAL, page({ blocks: [below] }).context);
    expect(below.animate).not.toHaveBeenCalled();
  });

  test("waits for a streaming page to be parsed", () => {
    const { context, blocks, parsed } = page({ loading: true });
    runInNewContext(REVEAL, context);
    expect(blocks[0]!.animate).not.toHaveBeenCalled();
    parsed();
    expect(blocks[0]!.animate).toHaveBeenCalled();
  });

  test("respects reduced motion", () => {
    const { context, blocks } = page({ reduced: true });
    runInNewContext(REVEAL, context);
    expect(blocks[0]!.animate).not.toHaveBeenCalled();
  });

  test("survives a browser whose animations fail or are missing", () => {
    expect(() =>
      runInNewContext(REVEAL, page({ blocks: [block(20, true)] }).context)
    ).not.toThrow();
    expect(() => runInNewContext(REVEAL, { document: { readyState: "complete" } })).not.toThrow();
  });
});
