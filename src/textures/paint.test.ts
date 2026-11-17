import { describe, expect, test } from "vitest";
import { paintTexture, toLabyrinth } from "./paint";
import { blobSprite, patches, SPREAD_MASKS } from "./texture";

/** A stand-in labyrinth: smooth stripes that wrap, as the real tile does. */
const SIZE = 64;
const stripes = Uint8Array.from({ length: SIZE * SIZE }, (_, at) => {
  const wave =
    Math.sin(((at % SIZE) / SIZE) * Math.PI * 8) * Math.sin((at / SIZE / SIZE) * Math.PI * 6);
  return Math.round(127.5 + 127.5 * wave);
});
const labyrinth = toLabyrinth(stripes, 1, SIZE);

const sprite = (color: string, inner: string) => {
  const { settings, size } = blobSprite(patches(color, inner, [], 96), 60);
  return paintTexture(labyrinth, settings, size, size);
};
const pixel = ({ pixels, width }: ReturnType<typeof sprite>, x: number, y: number) => [
  ...pixels.subarray((y * width + x) * 4, (y * width + x) * 4 + 4)
];

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
    const blob = sprite("#102030", "#102030");
    const alphas = new Set<number>();
    for (let at = 3; at < blob.pixels.length; at += 4) alphas.add(blob.pixels[at]!);
    expect(alphas.has(0) && alphas.has(255)).toBe(true);
    expect(alphas.size).toBeGreaterThan(20);
  });

  test("covers the same px whether a fused patch is filled at once or px by px", () => {
    // One tone takes the fast path through fused cells; a second tone, one value off, cannot.
    const filled = sprite("#102030", "#102030");
    const mixed = sprite("#102030", "#112030");
    expect([filled.width, filled.height]).toEqual([mixed.width, mixed.height]);
    for (let at = 0; at < filled.pixels.length; at += 4) {
      expect(filled.pixels[at + 3]).toBe(mixed.pixels[at + 3]);
      expect(Math.abs(filled.pixels[at]! - mixed.pixels[at]!)).toBeLessThanOrEqual(1);
    }
  });

  test("keeps the inner tone to the fused core", () => {
    const blob = sprite("#000000", "#ffffff");
    const middle = Math.floor(blob.width / 2);
    let inner = 0;
    for (let y = 0; y < blob.height; y++) {
      for (let x = 0; x < blob.width; x++) {
        const [red, , , alpha] = pixel(blob, x, y);
        if (red === 0) continue;
        inner++;
        expect(alpha).toBe(255);
        expect(Math.hypot(x - middle, y - middle)).toBeLessThan(blob.width * 0.45);
      }
    }
    expect(inner).toBeGreaterThan(100);
  });

  test("paints one seamless tile of `repeat` px, whatever size is asked for", () => {
    const tile = paintTexture(labyrinth, { ...SPREAD_MASKS.thick, repeat: 64, tile: 64 }, 0, 0);
    expect([tile.width, tile.height]).toEqual([64, 64]);
    // Without blobs or a ramp the field is flat, so the tile wraps as the labyrinth does.
    const again = paintTexture(labyrinth, { ...SPREAD_MASKS.thick, repeat: 128, tile: 64 }, 0, 0);
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        expect(pixel(again, x + 64, y + 64)).toEqual(pixel(tile, x, y));
      }
    }
  });

  test("the spread's core mask is clear where the main tone shows", () => {
    const core = paintTexture(labyrinth, { ...SPREAD_MASKS.core, repeat: 64, tile: 64 }, 0, 0);
    const alphas = new Set<number>();
    for (let at = 3; at < core.pixels.length; at += 4) alphas.add(core.pixels[at]!);
    expect(alphas.has(0) && alphas.has(255)).toBe(true);
  });
});
