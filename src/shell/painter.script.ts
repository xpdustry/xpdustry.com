/**
 * Has the textures painted in the visitor's browser, from the top of the head, before the
 * stylesheets, so nothing waits on them or on the page's scripts. The server writes it there
 * (`server.ts`); the page says where the worker is, on its root as `data-painter`. Every texture is the one
 * labyrinth tile, fused and frayed by a field: the worker's script carries the tile, so one
 * request is all the network does for every texture, and the worker paints them off the main
 * thread.
 *
 * A painted texture reaches the page through a style rule: `--paint-<name>` on the root for the
 * textures the styles name, `--paint` on `[data-paint="<key>"]` for a blob's sprite. Until then,
 * and in a browser that cannot paint, the texture is simply absent: content never waits on it.
 *
 * The first screen's frame is painted first, then the sprites on show, then the rest, so a slow
 * phone spends its first moments on what is in view. A worker that fails, as its download can on
 * a poor connection, is replaced and asked again for what is still waited on.
 */
export default function painter(
  names: string[],
  frame: string[],
  grown: string,
  order: Record<"frame" | "shown" | "named" | "grown" | "below", number>
): void {
  const TRIES = 3;
  /** The textures asked for and not yet painted: how soon each is wanted, and who waits. */
  const waiting = new Map<string, { priority: number; done: (image?: string) => void }>();
  const painted = new Map<string, Promise<string | undefined>>();
  let sheet: CSSStyleSheet | undefined;
  let port: Worker | undefined;
  let stopped = false;

  /** Nothing more will be painted: every texture still waited on is absent. */
  const stop = () => {
    stopped = true;
    port = undefined;
    for (const { done } of waiting.values()) done();
    waiting.clear();
  };

  const show = ({ data }: MessageEvent<{ key: string; image?: Blob }>) => {
    const image = data.image && URL.createObjectURL(data.image);
    if (image) {
      sheet!.insertRule(
        names.includes(data.key)
          ? `:root{--paint-${data.key}:url("${image}")}`
          : `[data-paint="${data.key}"]{--paint:url("${image}")}`
      );
    }
    waiting.get(data.key)?.done(image);
    waiting.delete(data.key);
  };

  /** Starts a worker and asks it for everything waited on; when it fails, another, `tries` times. */
  const hire = (tries: number) => {
    const hired = new Worker(document.documentElement.dataset.painter!, { type: "module" });
    hired.onmessage = show;
    hired.onerror = () => {
      hired.terminate();
      port = undefined;
      if (tries > 1) setTimeout(() => hire(tries - 1), 150);
      else stop();
    };
    port = hired;
    for (const [key, { priority }] of waiting) hired.postMessage({ key, priority });
  };

  const paint = (key: string, priority: number) => {
    let image = painted.get(key);
    if (!image) {
      image = new Promise((done) => {
        if (stopped) return done(undefined);
        waiting.set(key, { priority, done });
        port?.postMessage({ key, priority });
      });
      painted.set(key, image);
    }
    return image;
  };
  globalThis.paints = (key) => paint(key, order.shown);

  try {
    sheet = new CSSStyleSheet();
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    hire(TRIES);
  } catch {
    return stop();
  }

  for (const name of names) void paint(name, frame.includes(name) ? order.frame : order.named);

  const sprites = (root: ParentNode) => root.querySelectorAll<HTMLElement>("[data-paint]");
  const later = (key: string, priority: number) => (key.endsWith(grown) ? order.grown : priority);
  /** The sprites on show first, then, as the page changes, each one it gains. */
  const watch = () => {
    for (const sprite of sprites(document)) {
      const { top, bottom } = sprite.getBoundingClientRect();
      const key = sprite.dataset.paint!;
      void paint(key, bottom > 0 && top < innerHeight ? later(key, order.shown) : order.below);
    }
    new MutationObserver((changes) => {
      for (const { addedNodes } of changes) {
        for (const node of addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          const added = node.dataset.paint ? [node, ...sprites(node)] : sprites(node);
          for (const sprite of added) {
            void paint(sprite.dataset.paint!, later(sprite.dataset.paint!, order.shown));
          }
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === "loading") {
    addEventListener("DOMContentLoaded", watch, { once: true });
  } else {
    watch();
  }
}
