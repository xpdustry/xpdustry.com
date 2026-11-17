import { encode } from "fast-png";
import sharp from "sharp";
import { expect, test } from "vitest";
import { indexedPngRow, pngRow, truecolourPngRow } from "#tests/support/png";
import { averageColour } from "./colour";

const RED = [255, 0, 0] as const;
const GREEN = [0, 128, 0] as const;
const WHITE = [255, 255, 255] as const;
const CLEAR = 0;

/** Each picture, the average of its opaque pixels, and what sharp decodes it to when that is subtle. */
const PICTURES: [string, Uint8Array, string, number[][]?][] = [
  ["a picture", pngRow(3, [255, 0, 0, 0, 0, 255]), "#800080"],
  ["the opaque pixels of a picture", pngRow(4, [0, 128, 0, 255, 255, 255, 255, 0]), "#008000"],
  [
    "a truecolour picture keyed red by tRNS",
    truecolourPngRow([RED, GREEN, GREEN], RED),
    "#008000",
    [
      [...RED, CLEAR],
      [...GREEN, 255],
      [...GREEN, 255]
    ]
  ],
  [
    "a truecolour picture whose tRNS key no pixel has",
    truecolourPngRow([RED, GREEN, GREEN], WHITE),
    "#555500",
    [
      [...RED, 255],
      [...GREEN, 255],
      [...GREEN, 255]
    ]
  ],
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
    "a palette with an opaque entry between transparent ones",
    indexedPngRow([[...WHITE, CLEAR], [...GREEN, 255], [...RED, CLEAR], [...GREEN]], [0, 1, 2, 3]),
    "#008000",
    [
      [...WHITE, CLEAR],
      [...GREEN, 255],
      [...RED, CLEAR],
      [...GREEN, 255]
    ]
  ]
];

test.each(PICTURES)("averages %s", async (_label, png, colour, pixels) => {
  expect(averageColour(png)).toBe(colour);
  if (pixels) expect([...(await sharp(png).ensureAlpha().raw().toBuffer())]).toEqual(pixels.flat());
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
