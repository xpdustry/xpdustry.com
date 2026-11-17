import { encode } from "fast-png";
import { expect, test } from "vitest";
import { indexedPngRow, pngRow } from "#tests/support/png";
import { averageColour } from "./colour";

test.each([
  ["a picture", pngRow(3, [255, 0, 0, 0, 0, 255]), "#800080"],
  ["the opaque pixels of a picture", pngRow(4, [0, 128, 0, 255, 255, 255, 255, 0]), "#008000"],
  [
    "a picture drawn from a palette, as Discord's default faces are",
    indexedPngRow(
      [
        [255, 0, 0],
        [0, 0, 255]
      ],
      [0, 1]
    ),
    "#800080"
  ],
  [
    "the opaque pixels of a palette",
    indexedPngRow(
      [
        [255, 255, 255, 0],
        [0, 128, 0, 255]
      ],
      [0, 1]
    ),
    "#008000"
  ]
])("averages %s", (_label, png, colour) => {
  expect(averageColour(png)).toBe(colour);
});

test.each([
  ["nothing opaque", pngRow(4, [10, 20, 30, 0])],
  ["only grey", pngRow(1, [9])],
  [
    "16 bits a channel",
    encode({ width: 1, height: 1, channels: 3, depth: 16, data: new Uint16Array([1, 2, 3]) })
  ]
])("has no colour for a picture with %s", (_label, png) => {
  expect(averageColour(png)).toBeUndefined();
});
