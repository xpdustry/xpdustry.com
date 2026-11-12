import { runInNewContext } from "node:vm";
import { describe, expect, test, vi } from "vitest";
import { REVEAL } from "./reveal";

function browser({ loading = false, reduced = false, broken = false } = {}) {
  const animate = vi.fn((_frames: Keyframe[], _options: KeyframeAnimationOptions) => {
    if (broken) throw new Error("Animation unavailable");
  });
  const block = { getBoundingClientRect: () => ({ top: 20, bottom: 100 }), animate };
  const document = {
    readyState: loading ? "loading" : "complete",
    querySelectorAll: () => [block, block, block, block, block],
  };
  const addEventListener = vi.fn();
  return {
    animate,
    addEventListener,
    context: {
      document,
      addEventListener,
      matchMedia: () => ({ matches: reduced }),
      innerHeight: 800,
    },
  };
}

describe("inline reveal", () => {
  test("runs the serialized function without waiting for fonts or images", () => {
    const { context, animate } = browser();
    runInNewContext(REVEAL, context);
    expect(animate).toHaveBeenCalledTimes(5);
    for (const [frames, options] of animate.mock.calls) {
      expect(JSON.stringify(frames)).not.toContain("opacity");
      expect(options).toMatchObject({ duration: 350 });
      expect(options.delay).toBeLessThanOrEqual(120);
    }
  });

  test("enhances a streaming page after parsing without hiding it in the meantime", () => {
    const { context, animate, addEventListener } = browser({ loading: true });
    runInNewContext(REVEAL, context);
    expect(animate).not.toHaveBeenCalled();
    expect(addEventListener).toHaveBeenCalledWith("DOMContentLoaded", expect.any(Function), {
      once: true,
    });
    addEventListener.mock.calls[0]![1]();
    expect(animate).toHaveBeenCalled();
  });

  test("respects reduced motion", () => {
    const { context, animate } = browser({ reduced: true });
    runInNewContext(REVEAL, context);
    expect(animate).not.toHaveBeenCalled();
  });

  test("animation errors and missing APIs cannot leave content hidden", () => {
    expect(() => runInNewContext(REVEAL, browser({ broken: true }).context)).not.toThrow();
    expect(() => runInNewContext(REVEAL, { document: { readyState: "complete" } })).not.toThrow();
    expect(REVEAL).not.toMatch(/opacity|dataset|\.style|fonts|decode/);
  });
});
