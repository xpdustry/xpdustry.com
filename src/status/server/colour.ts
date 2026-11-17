import { convertIndexedToRgb, decode } from "fast-png";

const MIN_OPAQUE_ALPHA = 128;
const EIGHT_BIT_SAMPLE = 0xff;

const hex = (channel: number) => Math.round(channel).toString(16).padStart(2, "0");

interface RgbPixels {
  data: ArrayLike<number>;
  channels: number;
  transparentKey?: ArrayLike<number>;
}

function rgbPixels(png: Uint8Array): RgbPixels | undefined {
  const picture = decode(png);
  if (picture.palette) {
    return { data: convertIndexedToRgb(picture), channels: picture.palette[0]!.length };
  }
  const { data, channels, depth, transparency } = picture;
  if (depth !== 8 || channels < 3) return undefined;
  const transparentKey =
    transparency?.length === 3
      ? Array.from(transparency, (sample) => sample & EIGHT_BIT_SAMPLE)
      : undefined;
  return { data, channels, transparentKey };
}

const isKey = (data: ArrayLike<number>, at: number, key: ArrayLike<number>) =>
  data[at] === key[0] && data[at + 1] === key[1] && data[at + 2] === key[2];

export function averageColour(png: Uint8Array): string | undefined {
  const picture = rgbPixels(png);
  if (!picture) return undefined;
  const { data, channels, transparentKey } = picture;
  const sum = [0, 0, 0];
  let count = 0;
  for (let at = 0; at < data.length; at += channels) {
    if (channels === 4 && data[at + 3]! < MIN_OPAQUE_ALPHA) continue;
    if (transparentKey && isKey(data, at, transparentKey)) continue;
    for (const channel of [0, 1, 2]) sum[channel]! += data[at + channel]!;
    count++;
  }
  return count > 0 ? `#${sum.map((total) => hex(total / count)).join("")}` : undefined;
}
