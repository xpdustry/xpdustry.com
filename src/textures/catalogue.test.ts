import { expect, test } from "vitest";
import { FRAME_PAINTS, PAINT_NAMES, paint, painting } from "./catalogue";
import { CROWN } from "./page";

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

test("a style reads a named texture from the variable the painter sets on the root", () => {
  expect(paint("crown")).toMatch(/^var\(--paint-crown, /);
});
