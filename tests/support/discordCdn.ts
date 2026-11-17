import { encode } from "fast-png";
import sharp from "sharp";
import type { Route } from "./fetch";

export const CDN = "https://cdn.discordapp.com";

export const OWN_FACE_COLOUR = "#ff0000";
export const DEFAULT_FACE_COLOUR = "#0000ff";

const SNOWFLAKE = String.raw`\d+`;
const HASH = String.raw`\w+`;
const UPLOADED = [
  new RegExp(`^/avatars/${SNOWFLAKE}/${HASH}\\.(?<extension>\\w+)$`),
  new RegExp(`^/guilds/${SNOWFLAKE}/users/${SNOWFLAKE}/avatars/${HASH}\\.(?<extension>\\w+)$`),
  new RegExp(`^/banners/${SNOWFLAKE}/${HASH}\\.(?<extension>\\w+)$`)
];
const DEFAULT_AVATAR = /^\/embed\/avatars\/[0-5]\.png$/;

const TYPE_BY_EXTENSION: Record<string, "png" | "jpeg" | "webp" | "gif"> = {
  png: "png",
  jpg: "jpeg",
  jpeg: "jpeg",
  webp: "webp",
  gif: "gif"
};

const MIN_SIZE = 16;
const MAX_SIZE = 4096;
const isDocumentedSize = (size: number) =>
  Number.isInteger(size) && size >= MIN_SIZE && size <= MAX_SIZE && (size & (size - 1)) === 0;

export interface CdnPicture {
  body: Uint8Array;
  type: string;
}

export async function cdnPicture(path: string): Promise<CdnPicture> {
  const [r, g, b] = DEFAULT_AVATAR.test(path) ? [0, 0, 255] : [255, 0, 0];
  const format = DEFAULT_AVATAR.test(path) ? "png" : uploadedFormat(path);
  if (!format) throw new Error(`Discord's CDN serves nothing at ${path}`);
  if (format === "png") {
    const data = Uint8Array.from([r, g, b, 255, r, g, b, 255]);
    return {
      body: encode({ width: 2, height: 1, channels: 4, data, text: { path } }),
      type: "image/png"
    };
  }
  const body = await sharp({
    create: { width: 2, height: 1, channels: 4, background: { r, g, b } }
  })
    .toFormat(format)
    .withXmp(`<x:xmpmeta xmlns:x="adobe:ns:meta/"><path>${path}</path></x:xmpmeta>`)
    .toBuffer();
  return { body: new Uint8Array(body), type: `image/${format}` };
}

function uploadedFormat(path: string) {
  for (const endpoint of UPLOADED) {
    const extension = endpoint.exec(path)?.groups?.extension;
    if (extension) return TYPE_BY_EXTENSION[extension];
  }
  return undefined;
}

function refusal(url: URL): Response | undefined {
  if (DEFAULT_AVATAR.test(url.pathname)) return undefined;
  if (!uploadedFormat(url.pathname)) return new Response("Not Found", { status: 404 });
  const size = url.searchParams.get("size");
  if (size !== null && !isDocumentedSize(Number(size))) {
    return new Response("Invalid size", { status: 400 });
  }
  return undefined;
}

export const discordCdn =
  (brokenPaths: ReadonlySet<string> = new Set()): Route =>
  async (url) => {
    if (url.origin !== CDN) return undefined;
    if (brokenPaths.has(url.pathname)) return new Response(null, { status: 500 });
    const refused = refusal(url);
    if (refused) return refused;
    const { body, type } = await cdnPicture(url.pathname);
    return new Response(Buffer.from(body), { headers: { "content-type": type } });
  };
