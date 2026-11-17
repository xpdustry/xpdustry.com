import { crc32, deflateSync } from "node:zlib";
import { encode } from "fast-png";

export const pngRow = (channels: 1 | 3 | 4, values: readonly number[]) =>
  encode({ width: values.length / channels, height: 1, channels, data: Uint8Array.from(values) });

type Rgb = readonly [number, number, number];
type Rgba = readonly [number, number, number, number];

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const TRUECOLOUR = 2;
const INDEXED = 3;
const NO_FILTER = 0;

function chunk(type: string, data: readonly number[]): number[] {
  const typed = Buffer.from([...Buffer.from(type, "latin1"), ...data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed));
  return [...length, ...typed, ...crc];
}

function row(width: number, colourType: number, extra: number[][], samples: number[]): Uint8Array {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(1, 4);
  header.set([8, colourType, 0, 0, 0], 8);
  return Uint8Array.from([
    ...SIGNATURE,
    ...chunk("IHDR", [...header]),
    ...extra.flat(),
    ...chunk("IDAT", [...deflateSync(Uint8Array.from([NO_FILTER, ...samples]))]),
    ...chunk("IEND", [])
  ]);
}

const sixteenBits = (sample: number) => [sample >> 8, sample & 0xff];

export function truecolourPngRow(pixels: readonly Rgb[], transparent?: Rgb): Uint8Array {
  const trns = transparent ? [chunk("tRNS", transparent.flatMap(sixteenBits))] : [];
  return row(pixels.length, TRUECOLOUR, trns, pixels.flat());
}

export function indexedPngRow(palette: readonly (Rgb | Rgba)[], indices: readonly number[]) {
  const alphas = palette.map((colour) => colour[3] ?? 255);
  const lastTranslucent = alphas.findLastIndex((alpha) => alpha !== 255);
  const trns = lastTranslucent >= 0 ? [chunk("tRNS", alphas.slice(0, lastTranslucent + 1))] : [];
  const plte = chunk(
    "PLTE",
    palette.flatMap(([r, g, b]) => [r, g, b])
  );
  return row(indices.length, INDEXED, [plte, ...trns], [...indices]);
}
