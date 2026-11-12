import { readFileSync } from "node:fs";
import sharp from "sharp";
import { expect, test } from "vitest";
import { FRINGES, PATCHES, SPREADS } from "#app/data/patches";
import {
  BACKDROP,
  CROWN,
  FADE,
  RIDGE,
  blobSprites,
  type TextureSettings,
} from "#app/data/textures";
import { renderLogoFrames, restingFrame } from "#app/lib/logo-frames";
import { renderTexture, toLabyrinth } from "#app/lib/reticulate/field";

const assets = new URL("../assets/", import.meta.url);
const pixels = (name: string) =>
  sharp(new URL(name, assets).pathname).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

const reticulate = await pixels("reticulate.png");
const labyrinth = toLabyrinth(reticulate.data, reticulate.info.channels, reticulate.info.width);

async function expectRendered(name: string, settings: TextureSettings, width = 0, height = width) {
  const rendered = renderTexture(labyrinth, settings, width, height);
  const file = await pixels(name).catch(() => undefined);
  expect(file, `${name} is missing`).toBeDefined();
  expect([file!.info.width, file!.info.height]).toEqual([rendered.width, rendered.height]);
  expect(file!.data.equals(Buffer.from(rendered.pixels)), `${name} is out of date`).toBe(true);
}

// run `pnpm textures` after changing any of them
test.each(Object.entries(BACKDROP))(
  "the %s backdrop tile matches its settings",
  (layer, settings) => expectRendered(`backdrop-${layer}.webp`, settings),
);

test("the crown matches its settings", () =>
  expectRendered("crown.webp", CROWN.settings, CROWN.width, CROWN.height));

test("the ridge matches its settings", () =>
  expectRendered("ridge.webp", RIDGE.settings, RIDGE.width, RIDGE.height));

test("the fade matches its settings", () => expectRendered("fade.webp", FADE));

test("the logo's frames match the logo", { timeout: 60_000 }, async () => {
  const rendered = await renderLogoFrames(readFileSync(new URL("logo.svg", assets), "utf8"));
  const file = await pixels("logo-frames.webp");
  expect([file.info.width, file.info.height]).toEqual([rendered.width, rendered.height]);
  expect(file.data.equals(rendered.pixels), "logo-frames.webp is out of date").toBe(true);

  const resting = await sharp(rendered.pixels, {
    raw: { width: rendered.width, height: rendered.height, channels: 4 },
  })
    .extract(restingFrame())
    .raw()
    .toBuffer();
  const relief = await pixels("logo-relief.webp");
  expect(relief.data.equals(resting), "logo-relief.webp is out of date").toBe(true);
});

const sprites = new Map(
  Object.values(PATCHES).flatMap((patches) =>
    blobSprites(patches).map((sprite) => [sprite.name, sprite] as const),
  ),
);

test.each([...sprites.keys()])("the %s sprite matches its patches", (name) => {
  const sprite = sprites.get(name)!;
  return expectRendered(`patches/${name}.webp`, sprite.settings, sprite.size);
});

const tiles = new Map(
  Object.values(SPREADS).flatMap((spread) =>
    Object.values(spread).map((tile) => [tile.name, tile] as const),
  ),
);

test.each([...tiles.keys()])("the %s spread tile matches its palette", (name) =>
  expectRendered(`spread/${name}.webp`, tiles.get(name)!.settings),
);

test.each(FRINGES)("the $name strip matches its colour", (strip) =>
  expectRendered(`fringe/${strip.name}.webp`, strip.settings, strip.width, strip.height),
);
