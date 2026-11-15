import { expect, test } from "vitest";
import { PATCHES } from "./cards";
import { blobSprite, seeded } from "./texture";

test("changing a palette reuses the same blob geometry", () => {
  const patch = PATCHES.play;
  expect(blobSprite(patch, 187)).toEqual(
    blobSprite({ ...patch, color: "#ff0000", inner: "#0000ff" }, 187)
  );
});

test("the size ladder keeps the labyrinth pitch within 9% for the supported sizes", () => {
  for (let radius = 20; radius <= 200; radius++) {
    const sprite = blobSprite(PATCHES.play, radius);
    expect(Math.abs(sprite.displaySize / sprite.size - 1)).toBeLessThan(0.09);
  }
});

test("normal and grown masks line up at every placement", () => {
  for (const patch of Object.values(PATCHES)) {
    for (const [, , radius] of patch.blobs) {
      const base = blobSprite(patch, radius);
      const grown = blobSprite(patch, radius, true);
      expect([base.size, base.displaySize, base.tile]).toEqual([
        grown.size,
        grown.displaySize,
        grown.tile
      ]);
    }
  }
});

test("a name varies the placement and turns without adding images", () => {
  const first = seeded(PATCHES.siteCover, "one");
  const second = seeded(PATCHES.siteCover, "two");
  expect(first).toEqual(seeded(PATCHES.siteCover, "one"));
  expect(first.blobs).not.toEqual(second.blobs);
  expect(first.blobs.map(([, , radius]) => blobSprite(first, radius).name)).toEqual(
    second.blobs.map(([, , radius]) => blobSprite(second, radius).name)
  );
});
