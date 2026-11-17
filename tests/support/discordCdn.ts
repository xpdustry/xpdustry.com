import { encode } from "fast-png";
import type { Route } from "./fetch";

export const CDN = "https://cdn.discordapp.com";

export const OWN_FACE_COLOUR = "#ff0000";
export const DEFAULT_FACE_COLOUR = "#0000ff";

const isDefaultFace = (path: string) => path.startsWith("/embed/");

export function cdnPicture(path: string): Uint8Array {
  const pixel = isDefaultFace(path) ? [0, 0, 255, 255] : [255, 0, 0, 255];
  const data = Uint8Array.from([...pixel, ...pixel]);
  return encode({ width: 2, height: 1, channels: 4, data, text: { path } });
}

export const discordCdn =
  (brokenPaths: ReadonlySet<string> = new Set()): Route =>
  (url) => {
    if (url.origin !== CDN) return undefined;
    if (brokenPaths.has(url.pathname)) return new Response(null, { status: 500 });
    return new Response(Buffer.from(cdnPicture(url.pathname)), {
      headers: { "content-type": "image/png" }
    });
  };
