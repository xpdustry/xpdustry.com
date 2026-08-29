import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { encode } from "fast-png";
import { blurMask, reticulateField, toMask } from "./reticulate.ts";

function greyAlpha(alpha: Uint8Array): Uint8Array {
  const pixels = new Uint8Array(alpha.length * 2);
  for (let index = 0; index < alpha.length; index += 1) {
    pixels[index * 2] = 255;
    pixels[index * 2 + 1] = alpha[index];
  }
  return pixels;
}

// Phase two grows the 300px field into the final 400px tile.
const START_SIZE = 300;
const BLUR_RADIUS_PX = 2;

const target = fileURLToPath(new URL("../src/assets/reticulate.png", import.meta.url));
const started = Date.now();
const field = reticulateField(START_SIZE, 1);
const mask = blurMask(toMask(field), field.width, field.height, BLUR_RADIUS_PX);
const png = encode(
  {
    width: field.width,
    height: field.height,
    data: greyAlpha(mask),
    channels: 2,
    depth: 8,
  },
  { zlib: { level: 9 } },
);
writeFileSync(target, png);
console.log(
  `${field.width}x${field.height} in ${((Date.now() - started) / 1000).toFixed(1)}s -> ${target}`,
);
