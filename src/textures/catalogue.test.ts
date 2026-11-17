import { expect, test } from "vitest";
import { PATCHES } from "./cards";
import { FRAME_PAINTS, PAINT_NAMES, paint, painting } from "./catalogue";
import { BACKDROP, CROWN } from "./page";
import { blobSprite } from "./texture";

test("every named texture has something to paint, the first screen's frame first", () => {
  for (const name of PAINT_NAMES) {
    const { settings, width, height } = painting(name);
    expect(settings.repeat ?? Math.min(width, height), name).toBeGreaterThan(0);
  }
  expect(PAINT_NAMES.slice(0, FRAME_PAINTS.length).sort()).toEqual([...FRAME_PAINTS].sort());
});

test("a strip is painted at the size its styles lay it out", () => {
  expect(painting("crown")).toMatchObject({ width: CROWN.width, height: CROWN.height });
});

test("the backdrop is painted at half size, its labyrinth and its tile shrunk alike", () => {
  const { settings } = painting("backdrop-far");
  expect(settings.repeat).toBe(BACKDROP.far.repeat / 2);
  expect(settings.tile).toBe(BACKDROP.far.tile / 2);
  expect(settings.soft).toBeGreaterThan(0.07);
});

test("a blob's sprite is painted smaller than it shows, on a whole number of labyrinth px", () => {
  for (const patch of Object.values(PATCHES)) {
    for (const [, , radius] of patch.blobs) {
      const sprite = blobSprite(patch, radius);
      const { settings, width, height } = painting(sprite.key);
      expect(width).toBe(height);
      expect(width).toBeLessThan(sprite.size);
      expect(Number.isInteger(settings.tile)).toBe(true);
      expect(settings).toMatchObject({ color: patch.color, inner: patch.inner });
    }
  }
});

test("a named texture in a style is clear until it is painted", () => {
  expect(paint("crown")).toBe("var(--paint-crown, linear-gradient(#0000 0 0))");
});
