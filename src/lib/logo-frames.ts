// Renders the relief logo's sheet of frames, for `pnpm textures` and its test. Node only.

import sharp from "sharp";
import { FRAMES, frameIndex, frameOffset, reliefLogo } from "./logo.ts";

/** The sheet's RGBA pixels: `FRAMES.count` frames, `FRAMES.columns` to a row. */
export async function renderLogoFrames(source: string) {
  const { count, size, columns } = FRAMES;
  const logoAt = reliefLogo(source);
  const frames = await Promise.all(
    Array.from({ length: count }, (_, index) =>
      sharp(Buffer.from(logoAt(frameOffset(index))), { density: (72 * size) / 1072 })
        .resize(size, size)
        .png()
        .toBuffer(),
    ),
  );
  const width = size * columns;
  const height = size * Math.ceil(count / columns);
  const pixels = await sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(
      frames.map((input, index) => ({
        input,
        left: (index % columns) * size,
        top: Math.floor(index / columns) * size,
      })),
    )
    .raw()
    .toBuffer();
  return { pixels, width, height };
}

/** Where the resting frame sits in the sheet, which `logo-relief.webp` is cut from. */
export function restingFrame() {
  const { size, columns } = FRAMES;
  const index = frameIndex(0);
  return {
    left: (index % columns) * size,
    top: Math.floor(index / columns) * size,
    width: size,
    height: size,
  };
}
