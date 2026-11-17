import { encode } from "fast-png";

export const pngRow = (channels: 1 | 3 | 4, values: readonly number[]) =>
  encode({ width: values.length / channels, height: 1, channels, data: Uint8Array.from(values) });

export const indexedPngRow = (palette: number[][], indices: readonly number[]) =>
  encode({
    width: indices.length,
    height: 1,
    channels: 1,
    depth: 8,
    data: Uint8Array.from(indices),
    palette
  });
