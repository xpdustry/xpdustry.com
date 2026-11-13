import { encode } from "fast-png";
import { expect, test } from "vitest";
import { averageColour } from "./colour";

const png = (channels: 3 | 4, pixels: number[]) =>
  encode({ width: pixels.length / channels, height: 1, channels, data: new Uint8Array(pixels) });

test("averages the pixels of a picture", () => {
  expect(averageColour(png(3, [255, 0, 0, 0, 0, 255]))).toBe("#800080");
});

test("leaves out the transparent pixels", () => {
  expect(averageColour(png(4, [0, 128, 0, 255, 255, 255, 255, 0]))).toBe("#008000");
});

test("has no colour for a picture with nothing opaque", () => {
  expect(averageColour(png(4, [10, 20, 30, 0]))).toBeUndefined();
});

test("looks a palette's pixels up, as for Discord's default faces", () => {
  const indexed = (palette: number[][]) =>
    encode({ width: 2, height: 1, channels: 1, depth: 8, data: new Uint8Array([0, 1]), palette });

  expect(
    averageColour(
      indexed([
        [255, 0, 0],
        [0, 0, 255]
      ])
    )
  ).toBe("#800080");
  expect(
    averageColour(
      indexed([
        [255, 255, 255, 0],
        [0, 128, 0, 255]
      ])
    )
  ).toBe("#008000");
});

test("has no colour for a grey picture", () => {
  expect(
    averageColour(encode({ width: 1, height: 1, channels: 1, data: new Uint8Array([9]) }))
  ).toBeUndefined();
});
