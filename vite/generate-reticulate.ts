/**
 * Bakes the reticulate whipray pattern into `src/assets/reticulate-*.png`.
 *
 * The simulation is a few hundred million cell updates and a few seconds of
 * CPU, which is fine once on a laptop and not fine in a page load, so the mask
 * is committed as an asset. Re-run with:
 *
 *   node --experimental-strip-types vite/generate-reticulate.ts
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";
import { blurMask, reticulateField, toMask } from "./reticulate.ts";

/** Minimal 8-bit greyscale+alpha PNG. The mask only needs one channel of it. */
function encodeGreyAlphaPng(alpha: Uint8Array, width: number, height: number): Buffer {
  const raw = Buffer.alloc(height * (1 + width * 2));
  for (let y = 0; y < height; y += 1) {
    const row = y * (1 + width * 2);
    raw[row] = 0; // filter: none
    for (let x = 0; x < width; x += 1) {
      raw[row + 1 + x * 2] = 255; // grey, unused: the mask reads alpha
      raw[row + 2 + x * 2] = alpha[y * width + x];
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 4; // colour type: greyscale with alpha
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * 300 cells of tissue, grown to 400. The model's feature size is set by its
 * diffusion scale, not by the grid, so a bigger grid buys resolution rather
 * than a different pattern: more net per tile, and less of the browser's
 * bilinear upscale between the bake and the screen.
 */
const START_SIZE = 300;
/** Softening, in pixels of the baked tile. */
const BLUR_RADIUS = 2;

const target = fileURLToPath(new URL("../src/assets/reticulate.png", import.meta.url));
const started = Date.now();
const field = reticulateField(START_SIZE, 1);
const mask = blurMask(toMask(field), field.width, field.height, BLUR_RADIUS);
const png = encodeGreyAlphaPng(mask, field.width, field.height);
writeFileSync(target, png);
console.log(
  `${field.width}x${field.height} in ${((Date.now() - started) / 1000).toFixed(1)}s -> ${target}`,
);
