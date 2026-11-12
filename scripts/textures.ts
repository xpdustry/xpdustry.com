import { mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import sharp from "sharp";
import { renderLogoFrames, restingFrame } from "./logo-frames.ts";
import { ASSETS, RENDERED_FOLDERS, TEXTURES, render } from "./prerendered.ts";

const webp = (pixels: Buffer | Uint8ClampedArray, width: number, height: number) =>
  sharp(pixels, { raw: { width, height, channels: 4 } }).webp({
    lossless: true,
    exact: true,
    effort: 6
  });
const target = (file: string) => new URL(file, ASSETS).pathname;

const wanted = new Set(TEXTURES.map((texture) => texture.file));
for (const folder of RENDERED_FOLDERS) {
  mkdirSync(new URL(folder, ASSETS), { recursive: true });
  for (const file of readdirSync(new URL(folder, ASSETS))) {
    if (!wanted.has(`${folder}/${file}`)) rmSync(new URL(`${folder}/${file}`, ASSETS));
  }
}
for (const texture of TEXTURES) {
  const { pixels, width, height } = render(texture);
  await webp(pixels, width, height).toFile(target(texture.file));
}

const sheet = await renderLogoFrames(readFileSync(new URL("logo.svg", ASSETS), "utf8"));
await webp(sheet.pixels, sheet.width, sheet.height).toFile(target("logo-frames.webp"));
await webp(sheet.pixels, sheet.width, sheet.height)
  .extract(restingFrame())
  .toFile(target("logo-relief.webp"));

console.log(`${TEXTURES.length} textures and the logo's frames`);
