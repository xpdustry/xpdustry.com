import sharp from "sharp";
import { toLabyrinth, type Labyrinth } from "../src/textures/paint.ts";

export const ASSETS = new URL("../src/textures/assets/", import.meta.url);

export const PATTERN = "reticulate.png";
export const LABYRINTH = "labyrinth.avif";
const QUALITY = 70;

export async function readPattern() {
  const { data, info } = await sharp(new URL(PATTERN, ASSETS).pathname)
    .extractChannel("alpha")
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, size: info.width };
}

export async function encodeLabyrinth(): Promise<Buffer> {
  const { data, size } = await readPattern();
  return sharp(data, { raw: { width: size, height: size, channels: 1 } })
    .avif({ quality: QUALITY, effort: 9, chromaSubsampling: "4:4:4" })
    .toBuffer();
}

export async function readLabyrinthPixels() {
  const { data, info } = await sharp(new URL(LABYRINTH, ASSETS).pathname)
    .extractChannel(0)
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, size: info.width };
}

export async function readLabyrinth(): Promise<Labyrinth> {
  const { data, size } = await readLabyrinthPixels();
  return toLabyrinth(data, 1, size);
}
