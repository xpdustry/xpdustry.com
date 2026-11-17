import { convertIndexedToRgb, decode } from "fast-png";

const MIN_OPAQUE_ALPHA = 128;

const hex = (channel: number) => Math.round(channel).toString(16).padStart(2, "0");

function rgbPixels(png: Uint8Array) {
  const picture = decode(png);
  if (picture.palette) {
    return { data: convertIndexedToRgb(picture), channels: picture.palette[0]!.length };
  }
  const { data, channels, depth } = picture;
  return depth === 8 && channels >= 3 ? { data, channels } : undefined;
}

export function averageColour(png: Uint8Array): string | undefined {
  const picture = rgbPixels(png);
  if (!picture) return undefined;
  const { data, channels } = picture;
  const sum = [0, 0, 0];
  let count = 0;
  for (let at = 0; at < data.length; at += channels) {
    if (channels === 4 && data[at + 3]! < MIN_OPAQUE_ALPHA) continue;
    for (const channel of [0, 1, 2]) sum[channel]! += data[at + channel]!;
    count++;
  }
  return count > 0 ? `#${sum.map((total) => hex(total / count)).join("")}` : undefined;
}
