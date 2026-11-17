import { describe, expect, test } from "vitest";
import { paintTexture, toLabyrinth } from "./paint";
import { blobSprite, patches, SPREAD_MASKS } from "./texture";

type Painted = ReturnType<typeof paintTexture>;

const SIZE = 64;
const wrappingStripes = Uint8Array.from({ length: SIZE * SIZE }, (_, at) => {
  const wave =
    Math.sin(((at % SIZE) / SIZE) * Math.PI * 8) * Math.sin((at / SIZE / SIZE) * Math.PI * 6);
  return Math.round(127.5 + 127.5 * wave);
});
const standInLabyrinth = toLabyrinth(wrappingStripes, 1, SIZE);

const sprite = (color: string, inner: string) => {
  const { settings, size } = blobSprite(patches(color, inner, [], 96), 60);
  return paintTexture(standInLabyrinth, settings, size, size);
};
const pixel = ({ pixels, width }: Painted, x: number, y: number) => [
  ...pixels.subarray((y * width + x) * 4, (y * width + x) * 4 + 4)
];
const channel = ({ pixels }: Painted, offset: number) =>
  pixels.filter((_, at) => at % 4 === offset);
const alphas = (painted: Painted) => channel(painted, 3);
const square = ({ pixels, width }: Painted, left: number, top: number, size: number) =>
  Array.from({ length: size }, (_, y) => {
    const row = ((top + y) * width + left) * 4;
    return [...pixels.subarray(row, row + size * 4)];
  });

describe("toLabyrinth", () => {
  test("takes the first channel and stretches it to 0..1", () => {
    const { data, size } = toLabyrinth([0, 9, 100, 9, 50, 9, 200, 9], 2, 2);
    expect(size).toBe(2);
    expect([...data]).toEqual([0, 0.5, 0.25, 1]);
  });
});

describe("paintTexture", () => {
  test("fuses a blob's middle and leaves the sprite's corners clear", () => {
    const blob = sprite("#102030", "#102030");
    const middle = Math.floor(blob.width / 2);
    expect(pixel(blob, middle, middle)).toEqual([0x10, 0x20, 0x30, 255]);
    expect(pixel(blob, 0, 0)).toEqual([0, 0, 0, 0]);
    expect(pixel(blob, blob.width - 1, blob.height - 1)[3]).toBe(0);
  });

  test("frays between the two: some of the edge is covered, some is not", () => {
    const covered = new Set(alphas(sprite("#102030", "#102030")));
    expect(covered.has(0) && covered.has(255)).toBe(true);
    expect(covered.size).toBeGreaterThan(20);
  });

  test("covers the same px whether a fused patch is filled at once or px by px", () => {
    const filledAtOnce = sprite("#102030", "#102030");
    const filledPxByPx = sprite("#102030", "#112030");
    expect(alphas(filledPxByPx)).toEqual(alphas(filledAtOnce));
    const [onceReds, pxReds] = [channel(filledAtOnce, 0), channel(filledPxByPx, 0)];
    expect(Math.max(...onceReds.map((red, at) => Math.abs(red - pxReds[at]!)))).toBeLessThanOrEqual(
      1
    );
  });

  test("keeps the inner tone to the fused core", () => {
    const blob = sprite("#000000", "#ffffff");
    const middle = Math.floor(blob.width / 2);
    const inner: { distance: number; alpha: number }[] = [];
    for (let y = 0; y < blob.height; y++) {
      for (let x = 0; x < blob.width; x++) {
        const [red, , , alpha] = pixel(blob, x, y);
        if (red !== 0) inner.push({ distance: Math.hypot(x - middle, y - middle), alpha: alpha! });
      }
    }
    expect(inner.length).toBeGreaterThan(100);
    expect(inner.every(({ alpha }) => alpha === 255)).toBe(true);
    expect(Math.max(...inner.map(({ distance }) => distance))).toBeLessThan(blob.width * 0.45);
  });

  test("paints one seamless tile of `repeat` px, whatever size is asked for", () => {
    const oneTile = paintTexture(
      standInLabyrinth,
      { ...SPREAD_MASKS.thick, repeat: 64, tile: 64 },
      0,
      0
    );
    const fourTiles = paintTexture(
      standInLabyrinth,
      { ...SPREAD_MASKS.thick, repeat: 128, tile: 64 },
      0,
      0
    );
    expect(square(fourTiles, 64, 64, 64)).toEqual(square(oneTile, 0, 0, 64));
  });
});
