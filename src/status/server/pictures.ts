import { known, type Teammate } from "#app/brand/team";

const CDN = "https://cdn.discordapp.com";
const SERVED_FROM = "/discord";
const MAX_PICTURE_BYTES = 1024 * 1024;

interface Picture {
  body: Uint8Array<ArrayBuffer>;
  type: string;
}

async function bodyUpTo(
  response: Response,
  maxBytes: number
): Promise<Uint8Array<ArrayBuffer> | undefined> {
  if (!response.body) return undefined;
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.byteLength;
    if (size > maxBytes) {
      await response.body.cancel();
      return undefined;
    }
    chunks.push(chunk);
  }
  return new Uint8Array(Buffer.concat(chunks));
}

async function downloadPicture(
  url: string,
  signal: AbortSignal,
  fetchImpl: typeof fetch
): Promise<Picture | undefined> {
  try {
    const response = await fetchImpl(url, { signal });
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !type.startsWith("image/")) return undefined;
    const body = await bodyUpTo(response, MAX_PICTURE_BYTES);
    return body && { body, type };
  } catch {
    signal.throwIfAborted();
    return undefined;
  }
}

type Copies = Map<string, Promise<Picture | undefined>>;

export class Pictures {
  #byCdnPath = new Map<string, Picture>();

  get(cdnPath: string): Picture | undefined {
    return this.#byCdnPath.get(cdnPath);
  }

  async #servedUrl(
    url: string,
    signal: AbortSignal,
    fetchImpl: typeof fetch,
    thisRefresh: Copies
  ): Promise<string | undefined> {
    const { pathname } = new URL(url);
    let picture = thisRefresh.get(pathname);
    if (!picture) {
      const copied = this.#byCdnPath.get(pathname);
      picture = copied ? Promise.resolve(copied) : downloadPicture(url, signal, fetchImpl);
      thisRefresh.set(pathname, picture);
    }
    return (await picture) && `${SERVED_FROM}${pathname}`;
  }

  async localise(
    team: Teammate[],
    signal: AbortSignal,
    fetchImpl: typeof fetch = fetch
  ): Promise<Teammate[]> {
    const thisRefresh: Copies = new Map();
    const served = async (url: string | undefined) =>
      url?.startsWith(`${CDN}/`) ? this.#servedUrl(url, signal, fetchImpl, thisRefresh) : url;
    const localised = await Promise.all(
      team.map(async (person) => ({
        ...person,
        avatar: (await served(person.avatar)) ?? known[person.id]?.avatar,
        banner: await served(person.banner)
      }))
    );
    const copied = await Promise.all(
      [...thisRefresh].map(async ([path, picture]) => [path, await picture] as const)
    );
    this.#byCdnPath = new Map(
      copied.flatMap(([path, picture]) => (picture ? [[path, picture]] : []))
    );
    return localised;
  }
}
