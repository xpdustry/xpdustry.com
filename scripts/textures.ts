import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { ASSETS, LABYRINTH, encodeLabyrinth } from "./labyrinth.ts";
import { FRAMES, LOGO, renderLogoFrames, restingFrame } from "./logo-frames.ts";

const webp = (pixels: Buffer | Uint8ClampedArray, width: number, height: number) =>
  sharp(pixels, { raw: { width, height, channels: 4 } }).webp({
    lossless: true,
    exact: true,
    effort: 6
  });

const labyrinth = await encodeLabyrinth();
writeFileSync(new URL(LABYRINTH, ASSETS), labyrinth);

const sheet = await renderLogoFrames(readFileSync(LOGO, "utf8"));
await webp(sheet.pixels, sheet.width, sheet.height).toFile(
  new URL("logo-frames.webp", FRAMES).pathname
);
await webp(sheet.pixels, sheet.width, sheet.height)
  .extract(restingFrame())
  .toFile(new URL("logo-relief.webp", FRAMES).pathname);

console.log(`the labyrinth, ${labyrinth.length} bytes, and the logo's frames`);
