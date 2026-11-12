import { describe, expect, test } from "vitest";
import { spreadFrom, spreadFromPress } from "./Spread";

const rect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, width, height }) as DOMRectReadOnly;

describe("spreadFrom", () => {
  test("reaches the corner farthest from the origin", () => {
    expect(spreadFrom([0, 0], 30, 40)).toEqual({ origin: [0, 0], reach: 50 });
    expect(spreadFrom([30, 40], 30, 40).reach).toBe(50);
    expect(spreadFrom([10, 30], 40, 40).reach).toBe(Math.hypot(30, 30));
  });
});

describe("spreadFromPress", () => {
  const box = rect(100, 200, 300, 80);
  const chip = rect(350, 220, 40, 40);

  test("starts under the pointer, in the box's own px", () => {
    const press = { detail: 1, clientX: 130, clientY: 240 };
    expect(spreadFromPress(press, box, chip)).toEqual(spreadFrom([30, 40], 300, 80));
  });

  test("starts from the middle of the fallback for a key press", () => {
    const press = { detail: 0, clientX: 0, clientY: 0 };
    expect(spreadFromPress(press, box, chip).origin).toEqual([270, 40]);
  });
});
