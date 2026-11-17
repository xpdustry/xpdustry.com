// The team's faces and banners, served from here rather than from Discord's CDN, so a visitor's
// browser never asks Discord for anything. Each picture is fetched once, when the team is
// refreshed, and kept in memory: Discord names a picture after its content, so a name that has not
// changed is the same picture, and one that did is a new picture under a new URL.

import { known, type Teammate } from "#app/brand/team";

const CDN = "https://cdn.discordapp.com";
/** Where the site serves what it copied off the CDN, under the same path. */
const PREFIX = "/discord";
/** A face is a few kilobytes and a banner some tens of them; anything past this is not one. */
const LIMIT = 1024 * 1024;

interface Picture {
  body: Uint8Array<ArrayBuffer>;
  type: string;
}

/** The body of `response`, or nothing once it runs past {@link LIMIT}, which stops the download. */
async function capped(response: Response): Promise<Uint8Array<ArrayBuffer> | undefined> {
  if (!response.body) return undefined;
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.byteLength;
    if (size > LIMIT) {
      await response.body.cancel();
      return undefined;
    }
    chunks.push(chunk);
  }
  return new Uint8Array(Buffer.concat(chunks));
}

/** A picture off the CDN, or nothing for what is not one or failed to arrive. */
async function download(url: string, signal: AbortSignal, fetchImpl: typeof fetch) {
  try {
    const response = await fetchImpl(url, { signal });
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !type.startsWith("image/")) return undefined;
    const body = await capped(response);
    return body && { body, type };
  } catch {
    signal.throwIfAborted();
    return undefined;
  }
}

export class Pictures {
  /** By path on the CDN, which is also their path under {@link PREFIX}. */
  #pictures = new Map<string, Picture>();

  /** What was copied to `path`, under {@link PREFIX}. */
  get(path: string): Picture | undefined {
    return this.#pictures.get(path);
  }

  /**
   * A copy of a CDN picture: the one already made, the one this refresh is making, or a new one.
   * Its local URL, or nothing if it failed.
   */
  async #copy(
    url: string,
    signal: AbortSignal,
    fetchImpl: typeof fetch,
    kept: Map<string, Promise<Picture | undefined>>
  ): Promise<string | undefined> {
    const { pathname } = new URL(url);
    const had = this.#pictures.get(pathname);
    let picture = kept.get(pathname);
    if (!picture) {
      picture = had ? Promise.resolve(had) : download(url, signal, fetchImpl);
      kept.set(pathname, picture);
    }
    return (await picture) && `${PREFIX}${pathname}`;
  }

  /**
   * The team with each Discord picture swapped for a copy served from here, keeping only those
   * this team shows. A picture it could not copy gives way to the face `team.json` has for them, or
   * to none: never to Discord's.
   */
  async localise(
    team: Teammate[],
    signal: AbortSignal,
    fetchImpl: typeof fetch = fetch
  ): Promise<Teammate[]> {
    const kept = new Map<string, Promise<Picture | undefined>>();
    const copy = async (url: string | undefined) =>
      url?.startsWith(`${CDN}/`) ? this.#copy(url, signal, fetchImpl, kept) : url;
    const localised = await Promise.all(
      team.map(async (person) => ({
        ...person,
        avatar: (await copy(person.avatar)) ?? known[person.id]?.avatar,
        banner: await copy(person.banner)
      }))
    );
    const copied = await Promise.all(
      [...kept].map(async ([path, picture]) => [path, await picture] as const)
    );
    this.#pictures = new Map(
      copied.flatMap(([path, picture]) => (picture ? [[path, picture]] : []))
    );
    return localised;
  }
}
