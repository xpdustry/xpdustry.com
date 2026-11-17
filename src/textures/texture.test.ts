import { expect, test } from "vitest";
import { PATCHES } from "./cards";
import { blobSprite, blobSpriteOf, seeded, shaped } from "./texture";

test("a sprite's key is all the painter needs to paint it again", () => {
  for (const patch of [...Object.values(PATCHES), shaped(PATCHES.play, 3)]) {
    for (const [, , radius] of patch.blobs) {
      for (const grown of patch.grow ? [false, true] : [false]) {
        const sprite = blobSprite(patch, radius, grown);
        expect(blobSpriteOf(sprite.key)).toEqual(sprite);
      }
    }
  }
});

test("a blob's grown sprite lines up with it: same size, same labyrinth, a wider patch", () => {
  for (const patch of Object.values(PATCHES).filter(({ grow }) => grow)) {
    for (const [, , radius] of patch.blobs) {
      const base = blobSprite(patch, radius);
      const grown = blobSprite(patch, radius, true);
      expect(grown.key).not.toBe(base.key);
      expect(grown.size).toBe(base.size);
      expect(grown.settings.tile).toBe(base.settings.tile);
      expect(grown.settings.blobs[0]![2]).toBeGreaterThan(base.settings.blobs[0]![2]);
    }
  }
});

test("a name varies the placement and turns without painting more sprites", () => {
  const first = seeded(PATCHES.siteCover, "one");
  const second = seeded(PATCHES.siteCover, "two");
  expect(first).toEqual(seeded(PATCHES.siteCover, "one"));
  expect(first.blobs).not.toEqual(second.blobs);
  expect(first.blobs.map(([, , radius]) => blobSprite(first, radius).key)).toEqual(
    second.blobs.map(([, , radius]) => blobSprite(second, radius).key)
  );
});
