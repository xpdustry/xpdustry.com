// Hands texture requests to the worker and keeps the results, so the same card at the same size
// (another visit to the page, or a resize back) costs nothing.

import type { TextureSettings } from "#app/data/textures";
import type { TextureRequest, TextureResponse } from "#app/lib/reticulate/worker";

const MAX_CACHED = 160;

let worker: Worker | undefined;
let nextId = 0;
const pending = new Map<
  number,
  { resolve: (url: string) => void; reject: (error: Error) => void }
>();
const cache = new Map<string, Promise<string>>();

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
  worker.addEventListener("message", (event: MessageEvent<TextureResponse>) => {
    const request = pending.get(event.data.id);
    if (!request) return;
    pending.delete(event.data.id);
    if ("blob" in event.data) request.resolve(URL.createObjectURL(event.data.blob));
    else request.reject(new Error(event.data.error));
  });
  return worker;
}

/** An object URL of the texture's PNG, `width` by `height` px (or one `repeat` tile). */
export function requestTexture(
  settings: TextureSettings,
  width: number,
  height: number,
): Promise<string> {
  const key = `${JSON.stringify(settings)} ${width}x${height}`;
  const cached = cache.get(key);
  if (cached) {
    // most recently used goes last, so eviction takes the stalest
    cache.delete(key);
    cache.set(key, cached);
    return cached;
  }

  const result = new Promise<string>((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, settings, width, height } satisfies TextureRequest);
  });
  result.catch(() => cache.delete(key));
  cache.set(key, result);

  if (cache.size > MAX_CACHED) {
    const [oldest, url] = cache.entries().next().value!;
    cache.delete(oldest);
    void url.then(URL.revokeObjectURL, () => {});
  }
  return result;
}
