// Hands texture requests to a few workers, those nearest the viewport first, and keeps the
// results: in memory for this visit, and in Cache Storage for the next, so a reload paints at once.

import type { TextureSettings } from "#app/data/textures";
import type { TextureRequest, TextureResponse } from "#app/lib/reticulate/worker";
import workerUrl from "#app/lib/reticulate/worker.ts?worker&url";

const MAX_CACHED = 160;
const MAX_STORED = 240;
const TIDY_AFTER_MS = 5000;
const POOL_SIZE = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1));
// the worker's URL is hashed with the renderer it bundles, so a new renderer starts a new store
const STORE = `reticulate ${workerUrl}`;

interface Job extends TextureRequest {
  priority: number;
  resolve: (blob: Blob) => void;
  reject: (error: Error) => void;
}

const queue: Job[] = [];
const idle: Worker[] = [];
let spawned = 0;

function takeWorker(): Worker | undefined {
  const worker = idle.pop();
  if (worker || spawned >= POOL_SIZE) return worker;
  spawned++;
  return new Worker(workerUrl, { type: "module" });
}

function pump(): void {
  while (queue.length > 0) {
    const worker = takeWorker();
    if (!worker) return;
    const next = queue.reduce(
      (best, job, index) => (job.priority < queue[best]!.priority ? index : best),
      0,
    );
    const { priority: _, resolve, reject, ...request } = queue.splice(next, 1)[0]!;
    worker.onmessage = (event: MessageEvent<TextureResponse>) => {
      if ("blob" in event.data) resolve(event.data.blob);
      else reject(new Error(event.data.error));
      idle.push(worker);
      pump();
    };
    worker.postMessage(request satisfies TextureRequest);
  }
}

function render(request: TextureRequest, priority: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    queue.push({ ...request, priority, resolve, reject });
    pump();
  });
}

let store: Promise<Cache | undefined> | undefined;

/**
 * This renderer's store; none in development. Older renderers' stores are dropped and this one
 * trimmed a while after, as listing the stores can take most of a second while the page loads.
 */
function openStore(): Promise<Cache | undefined> {
  store ??= (async () => {
    if (import.meta.env.DEV || !("caches" in globalThis)) return undefined;
    const cache = await caches.open(STORE);
    setTimeout(() => void tidy(cache).catch(() => {}), TIDY_AFTER_MS);
    return cache;
  })().catch(() => undefined); // private windows may refuse storage
  return store;
}

async function tidy(cache: Cache): Promise<void> {
  for (const name of await caches.keys()) {
    if (name.startsWith("reticulate ") && name !== STORE) await caches.delete(name);
  }
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, -MAX_STORED).map((key) => cache.delete(key)));
}

async function load(key: string, request: TextureRequest, priority: number): Promise<string> {
  const cache = await openStore();
  const address = `${location.origin}/reticulate/${encodeURIComponent(key)}`;
  const stored = await cache?.match(address);
  if (stored) return URL.createObjectURL(await stored.blob());

  const blob = await render(request, priority);
  void cache?.put(address, new Response(blob)).catch(() => {});
  return URL.createObjectURL(blob);
}

const loaded = new Map<string, Promise<string>>();

/**
 * An object URL of the texture's PNG, `width` by `height` px. A lower `priority` renders sooner:
 * pass how far the element is from the viewport.
 */
export function requestTexture(
  settings: TextureSettings,
  width: number,
  height: number,
  priority = 0,
): Promise<string> {
  const key = `${JSON.stringify(settings)} ${width}x${height}`;
  const cached = loaded.get(key);
  if (cached) {
    // most recently used goes last, so eviction takes the stalest
    loaded.delete(key);
    loaded.set(key, cached);
    return cached;
  }

  const result = load(key, { settings, width, height }, priority);
  result.catch(() => loaded.delete(key));
  loaded.set(key, result);

  if (loaded.size > MAX_CACHED) {
    const [oldest, url] = loaded.entries().next().value!;
    loaded.delete(oldest);
    void url.then(URL.revokeObjectURL, () => {});
  }
  return result;
}
