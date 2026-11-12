import { describe, expect, test } from "vitest";
import { toMask, wrappedBoxBlur } from "./reticulate.ts";

const fieldOf = (b: number[]) => ({
  a: new Float64Array(b.length),
  b: Float64Array.from(b),
  width: b.length,
  height: 1
});

describe("toMask", () => {
  test("covers the lowest B fully and leaves B past the cutoff bare", () => {
    expect([...toMask(fieldOf([2, 2.5, 3, 12]))]).toEqual([255, 240, 202, 0]);
  });

  test("covers a flat field fully", () => {
    expect([...toMask(fieldOf([4, 4, 4]))]).toEqual([255, 255, 255]);
  });
});

describe("wrappedBoxBlur", () => {
  const size = 9;
  const at = (x: number, y: number) => y * size + x;

  test("leaves a flat mask unchanged", () => {
    const flat = new Uint8Array(size * size).fill(100);
    expect(wrappedBoxBlur(flat, size, size, 1)).toEqual(flat);
  });

  test("spreads a point evenly across both edges", () => {
    const point = new Uint8Array(size * size);
    point[at(0, 0)] = 255;
    const blurred = wrappedBoxBlur(point, size, size, 1);

    expect(blurred[at(0, 0)]).toBeGreaterThan(blurred[at(1, 0)]!);
    for (const [x, y] of [
      [1, 0],
      [0, 1],
      [2, 1],
      [1, 2]
    ] as const) {
      expect(blurred[at((size - x) % size, y)]).toBe(blurred[at(x, y)]);
      expect(blurred[at(x, (size - y) % size)]).toBe(blurred[at(x, y)]);
      expect(blurred[at(y, x)]).toBe(blurred[at(x, y)]);
    }
    expect(blurred[at(4, 4)]).toBe(0);
  });
});
