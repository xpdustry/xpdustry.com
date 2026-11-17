import { encode } from "fast-png";
import type { Route } from "./fetch";

export const CDN = "https://cdn.discordapp.com";

export const OWN_FACE_COLOUR = "#ff0000";
export const DEFAULT_FACE_COLOUR = "#0000ff";

const DEFAULT_AVATAR = /^\/embed\/avatars\/[0-5]\.png$/;
const UPLOADED =
  /^\/(?:avatars\/\d+|banners\/\d+|guilds\/\d+\/users\/\d+\/avatars)\/\w+\.(?<format>webp|png)$/;

export interface CdnPicture {
  body: Uint8Array;
  type: string;
}

/**
 * What the CDN sends for each path the site asks for: an uploaded picture as WebP bytes naming
 * its path, so no two are alike, and a thumbnail or default face as a PNG of the face's colour.
 */
export function cdnPicture(path: string): CdnPicture | undefined {
  const uploaded = UPLOADED.exec(path)?.groups?.format;
  if (uploaded === "webp") {
    return { body: new TextEncoder().encode(`RIFF WEBP ${path}`), type: "image/webp" };
  }
  if (!uploaded && !DEFAULT_AVATAR.test(path)) return undefined;
  const [r, g, b] = uploaded ? [255, 0, 0] : [0, 0, 255];
  const data = Uint8Array.from([r, g, b, 255]);
  return { body: encode({ width: 1, height: 1, channels: 4, data }), type: "image/png" };
}

export const discordCdn =
  (brokenPaths: ReadonlySet<string> = new Set()): Route =>
  (url) => {
    if (url.origin !== CDN) return undefined;
    if (brokenPaths.has(url.pathname)) return new Response(null, { status: 500 });
    const picture = cdnPicture(url.pathname);
    if (!picture) return new Response("Not Found", { status: 404 });
    return new Response(Buffer.from(picture.body), { headers: { "content-type": picture.type } });
  };
