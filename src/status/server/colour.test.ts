import { encode } from "fast-png";
import sharp from "sharp";
import { expect, test } from "vitest";
import { indexedPngRow, pngRow, truecolourPngRow } from "#tests/support/png";
import { averageColour } from "./colour";

const RED = [255, 0, 0] as const;
const GREEN = [0, 128, 0] as const;
const WHITE = [255, 255, 255] as const;
const CLEAR = 0;

const FIXTURES = {
  "a truecolour picture keyed red by tRNS": {
    png: truecolourPngRow([RED, GREEN, GREEN], RED),
    pixels: [
      [...RED, CLEAR],
      [...GREEN, 255],
      [...GREEN, 255]
    ]
  },
  "a truecolour picture keyed red by tRNS with its unused high bits set": {
    png: truecolourPngRow([RED, GREEN, GREEN], [0x01ff, 0x0100, 0x0100]),
    pixels: [
      [...RED, CLEAR],
      [...GREEN, 255],
      [...GREEN, 255]
    ]
  },
  "a truecolour picture whose tRNS key no pixel has": {
    png: truecolourPngRow([RED, GREEN, GREEN], WHITE),
    pixels: [
      [...RED, 255],
      [...GREEN, 255],
      [...GREEN, 255]
    ]
  },
  "a palette with an opaque entry before a transparent one": {
    png: indexedPngRow(
      [
        [...GREEN, 255],
        [...WHITE, CLEAR]
      ],
      [0, 1]
    ),
    pixels: [
      [...GREEN, 255],
      [...WHITE, CLEAR]
    ]
  },
  "a palette with an opaque entry between transparent ones": {
    png: indexedPngRow(
      [[...WHITE, CLEAR], [...GREEN, 255], [...RED, CLEAR], [...GREEN]],
      [0, 1, 2, 3]
    ),
    pixels: [
      [...WHITE, CLEAR],
      [...GREEN, 255],
      [...RED, CLEAR],
      [...GREEN, 255]
    ]
  }
};

test.each(Object.entries(FIXTURES))("%s decodes in sharp to the pixels it claims", async (_, f) => {
  const decoded = await sharp(f.png).ensureAlpha().raw().toBuffer();
  expect([...decoded]).toEqual(f.pixels.flat());
});

test.each([
  ["a truecolour picture keyed red by tRNS", "#008000"],
  ["a truecolour picture keyed red by tRNS with its unused high bits set", "#008000"],
  ["a truecolour picture whose tRNS key no pixel has", "#555500"],
  ["a palette with an opaque entry before a transparent one", "#008000"],
  ["a palette with an opaque entry between transparent ones", "#008000"]
] as const)("averages only what is opaque in %s", (fixture, colour) => {
  expect(averageColour(FIXTURES[fixture].png)).toBe(colour);
});

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
