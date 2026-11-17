import { describe, expect, test } from "vitest";
import { spreadFrom, spreadFromPress } from "./Spread";

const rect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, width, height }) as DOMRectReadOnly;

describe("spreadFrom", () => {
  test.each([
    [[0, 0], 30, 40, 50],
    [[30, 40], 30, 40, 50],
    [[10, 30], 40, 40, Math.hypot(30, 30)]
  ] as const)(
    "from %j in %i by %i px, reaches the farthest corner, %f px away",
    (origin, width, height, reach) => {
      expect(spreadFrom(origin, width, height)).toEqual({ origin, reach });
    }
  );
});

describe("spreadFromPress", () => {
  const box = rect(100, 200, 300, 80);
  const chip = rect(350, 220, 40, 40);

  test("starts under the pointer, in the box's own px", () => {
    const press = { detail: 1, clientX: 130, clientY: 240 };
    expect(spreadFromPress(press, box, chip)).toEqual({
      origin: [30, 40],
      reach: Math.hypot(300 - 30, 40)
    });
  });

  test("starts from the middle of the fallback for a key press", () => {
    const press = { detail: 0, clientX: 0, clientY: 0 };
    expect(spreadFromPress(press, box, chip).origin).toEqual([270, 40]);
  });
});
