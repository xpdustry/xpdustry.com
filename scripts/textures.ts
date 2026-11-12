// Renders every texture, as none changes after a build: the backdrop's tiles, the page's crown and
// the footer's ridge, the cards' own labyrinth, the relief logo's frames, a sprite for every card's
// blob, the tiles of every spread and every fringe. Sprites, tiles and fringes nothing uses any
// more are deleted. `prerendered.test.ts` fails when any of them is out of date.

import { mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import sharp from "sharp";
import { FRINGES, PATCHES, SPREADS } from "../src/data/patches.ts";
import {
  BACKDROP,
  CROWN,
  FADE,
  RIDGE,
  blobSprites,
  type TextureSettings,
} from "../src/data/textures.ts";
import { renderLogoFrames, restingFrame } from "../src/lib/logo-frames.ts";
import { renderTexture, toLabyrinth } from "../src/lib/reticulate/field.ts";

const assets = new URL("../src/assets/", import.meta.url);
const sprites = new URL("patches/", assets);
const spreads = new URL("spread/", assets);
const fringes = new URL("fringe/", assets);

const { data, info } = await sharp(new URL("reticulate.png", assets).pathname)
  .raw()
  .toBuffer({ resolveWithObject: true });
const labyrinth = toLabyrinth(data, info.channels, info.width);

async function write(target: URL, settings: TextureSettings, width = 0, height = 0) {
  const rendered = renderTexture(labyrinth, settings, width, height);
  await sharp(rendered.pixels, {
    raw: { width: rendered.width, height: rendered.height, channels: 4 },
  })
    .webp({ lossless: true, exact: true, effort: 6 })
    .toFile(target.pathname);
}

for (const [layer, settings] of Object.entries(BACKDROP)) {
  await write(new URL(`backdrop-${layer}.webp`, assets), settings);
}
await write(new URL("crown.webp", assets), CROWN.settings, CROWN.width, CROWN.height);
await write(new URL("ridge.webp", assets), RIDGE.settings, RIDGE.width, RIDGE.height);
await write(new URL("fade.webp", assets), FADE);
const sheet = await renderLogoFrames(readFileSync(new URL("logo.svg", assets), "utf8"));
await sharp(sheet.pixels, { raw: { width: sheet.width, height: sheet.height, channels: 4 } })
  .webp({ lossless: true, exact: true, effort: 6 })
  .toFile(new URL("logo-frames.webp", assets).pathname);
await sharp(sheet.pixels, { raw: { width: sheet.width, height: sheet.height, channels: 4 } })
  .extract(restingFrame())
  .webp({ lossless: true, exact: true, effort: 6 })
  .toFile(new URL("logo-relief.webp", assets).pathname);

mkdirSync(sprites, { recursive: true });
const wanted = new Map(
  Object.values(PATCHES).flatMap((patches) =>
    blobSprites(patches).map((sprite): [string, typeof sprite] => [`${sprite.name}.webp`, sprite]),
  ),
);
for (const file of readdirSync(sprites)) {
  if (!wanted.has(file)) rmSync(new URL(file, sprites));
}
for (const [file, sprite] of wanted) {
  await write(new URL(file, sprites), sprite.settings, sprite.size, sprite.size);
}

mkdirSync(spreads, { recursive: true });
const tiles = new Map(
  Object.values(SPREADS).flatMap((spread) =>
    Object.values(spread).map((tile): [string, typeof tile] => [`${tile.name}.webp`, tile]),
  ),
);
for (const file of readdirSync(spreads)) {
  if (!tiles.has(file)) rmSync(new URL(file, spreads));
}
for (const [file, tile] of tiles) {
  await write(new URL(file, spreads), tile.settings);
}

mkdirSync(fringes, { recursive: true });
const strips = new Map(FRINGES.map((strip) => [`${strip.name}.webp`, strip]));
for (const file of readdirSync(fringes)) {
  if (!strips.has(file)) rmSync(new URL(file, fringes));
}
for (const [file, strip] of strips) {
  await write(new URL(file, fringes), strip.settings, strip.width, strip.height);
}
console.log(
  `${Object.keys(BACKDROP).length} backdrop tiles, the crown, the ridge, the fade, the logo, ${wanted.size} sprites, ${tiles.size} spread tiles, ${strips.size} fringes`,
);
