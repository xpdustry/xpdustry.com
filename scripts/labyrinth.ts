import sharp from "sharp";
import { toLabyrinth, type Labyrinth } from "../src/textures/paint.ts";

export const ASSETS = new URL("../src/textures/assets/", import.meta.url);

/** Decodes an image into RGBA pixels. */
export const readPixels = (file: string, folder: URL = ASSETS) =>
  sharp(new URL(file, folder).pathname).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

/**
 * The labyrinth as the browser gets it: the pattern `pnpm pattern` grew, as one grey AVIF. Every
 * texture is painted from this tile, so it is the only texture the network carries. The painter
 * thresholds it, which forgives the little a lossy encoding moves its values.
 */
export const LABYRINTH = "labyrinth.avif";
const QUALITY = 70;

/** The pattern itself, which `reticulate.png` keeps in its alpha. */
export async function readPattern() {
  const { data, info } = await sharp(new URL("reticulate.png", ASSETS).pathname)
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

/** The tile's decoded values, one per px. */
export async function readLabyrinthPixels() {
  const { data, info } = await sharp(new URL(LABYRINTH, ASSETS).pathname)
    .extractChannel(0)
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, size: info.width };
}

/** The labyrinth the painter paints from, decoded as a browser decodes it. */
export async function readLabyrinth(): Promise<Labyrinth> {
  const { data, size } = await readLabyrinthPixels();
  return toLabyrinth(data, 1, size);
}
