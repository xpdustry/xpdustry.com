import { expect, test } from "vitest";
import { PATCHES } from "./cards";
import { FRAME_PAINTS, PAINT_NAMES, paint, painting } from "./catalogue";
import { BACKDROP, CROWN } from "./page";
import { blobSprite } from "./texture";

test.each(PAINT_NAMES)("%s has something to paint", (name) => {
  const { settings, width, height } = painting(name);
  expect(settings.repeat ?? Math.min(width, height)).toBeGreaterThan(0);
});

test("the first screen's frame is painted before the other named textures", () => {
  expect(PAINT_NAMES.slice(0, FRAME_PAINTS.length).sort()).toEqual([...FRAME_PAINTS].sort());
});

test("the crown is painted at the size its styles lay it out", () => {
  expect(painting("crown")).toMatchObject({ width: CROWN.width, height: CROWN.height });
});

test("the backdrop is painted on fewer px than it shows, and still wraps on whole tiles", () => {
  const { settings } = painting("backdrop-far");
  expect(settings.repeat).toBeLessThan(BACKDROP.far.repeat);
  expect(settings.repeat! / settings.tile!).toBe(BACKDROP.far.repeat / BACKDROP.far.tile);
});

test("a texture painted on fewer px gets softer edges, so it looks as it would at full size", () => {
  expect(painting("backdrop-far").settings.softEdge).toBeGreaterThan(
    painting("crown").settings.softEdge!
  );
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

const TRANSPARENT = /^(transparent|#[0-9a-f]{3}0|#[0-9a-f]{6}00|rgba?\([^)]*[,/]\s*0(\.0*)?\))$/i;

test("a style reads a named texture from the variable the painter sets on the root", () => {
  expect(paint("crown")).toMatch(/^var\(--paint-crown, /);
});

test("a named texture shows nothing until it is painted", () => {
  const fallback = /^var\(--paint-crown, linear-gradient\((.+?)(?: 0 0)?\)\)$/.exec(paint("crown"));
  expect(fallback?.[1]).toMatch(TRANSPARENT);
});
