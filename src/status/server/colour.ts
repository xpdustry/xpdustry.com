import { convertIndexedToRgb, decode } from "fast-png";

/** A pixel this transparent leaves the picture's background to show, so it has no say. */
const OPAQUE = 128;

const hex = (channel: number) => Math.round(channel).toString(16).padStart(2, "0");

/**
 * A PNG's pixels as red, green and blue, with or without alpha, or nothing in a form this does
 * not read: grey, or more than eight bits a channel. A palette's pixels are looked up in it,
 * which is how Discord serves its default faces.
 */
function pixels(png: Uint8Array) {
  const picture = decode(png);
  if (picture.palette) {
    return { data: convertIndexedToRgb(picture), channels: picture.palette[0]!.length };
  }
  const { data, channels, depth } = picture;
  return depth === 8 && channels >= 3 ? { data, channels } : undefined;
}

/** The average colour of a PNG's opaque pixels, as `#rrggbb`, or nothing for one with none. */
export function averageColour(png: Uint8Array): string | undefined {
  const picture = pixels(png);
  if (!picture) return undefined;
  const { data, channels } = picture;
  const sum = [0, 0, 0];
  let count = 0;
  for (let at = 0; at < data.length; at += channels) {
    if (channels === 4 && data[at + 3]! < OPAQUE) continue;
    for (const channel of [0, 1, 2]) sum[channel]! += data[at + channel]!;
    count++;
  }
  return count > 0 ? `#${sum.map((total) => hex(total / count)).join("")}` : undefined;
}
