export default function painter(
  names: string[],
  frame: string[],
  grownSuffix: string,
  priority: Record<"frame" | "shown" | "named" | "grown" | "below", number>
): void {
  const WORKER_TRIES = 3;
  const RETRY_MS = 150;
  const unpainted = new Map<string, { priority: number; done: (image?: string) => void }>();
  const painted = new Map<string, Promise<string | undefined>>();
  let sheet: CSSStyleSheet | undefined;
  let port: Worker | undefined;
  let gaveUp = false;

  const giveUp = () => {
    gaveUp = true;
    port = undefined;
    for (const { done } of unpainted.values()) done();
    unpainted.clear();
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
    unpainted.get(data.key)?.done(image);
    unpainted.delete(data.key);
  };

  const hireWorker = (triesLeft: number) => {
    const hired = new Worker(document.documentElement.dataset.painter!, { type: "module" });
    hired.onmessage = show;
    hired.onerror = () => {
      hired.terminate();
      port = undefined;
      if (triesLeft > 1) setTimeout(() => hireWorker(triesLeft - 1), RETRY_MS);
      else giveUp();
    };
    port = hired;
    for (const [key, request] of unpainted) hired.postMessage({ key, priority: request.priority });
  };

  const paint = (key: string, keyPriority: number) => {
    let image = painted.get(key);
    const queued = unpainted.get(key);
    if (queued && keyPriority < queued.priority) {
      queued.priority = keyPriority;
      port?.postMessage({ key, priority: keyPriority });
    }
    if (!image) {
      image = new Promise((done) => {
        if (gaveUp) return done(undefined);
        unpainted.set(key, { priority: keyPriority, done });
        port?.postMessage({ key, priority: keyPriority });
      });
      painted.set(key, image);
    }
    return image;
  };
  globalThis.paints = (key) => paint(key, priority.shown);

  try {
    sheet = new CSSStyleSheet();
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    hireWorker(WORKER_TRIES);
  } catch {
    return giveUp();
  }

  for (const name of names) {
    void paint(name, frame.includes(name) ? priority.frame : priority.named);
  }

  const sprites = (root: ParentNode) => root.querySelectorAll<HTMLElement>("[data-paint]");
  const onShowPriority = (key: string) =>
    key.endsWith(grownSuffix) ? priority.grown : priority.shown;
  const paintSpritesOnShowThenBelow = () => {
    for (const sprite of sprites(document)) {
      const { top, bottom } = sprite.getBoundingClientRect();
      const key = sprite.dataset.paint!;
      void paint(key, bottom > 0 && top < innerHeight ? onShowPriority(key) : priority.below);
    }
  };
  const paintSpritesTheBodyGains = () =>
    new MutationObserver((changes) => {
      for (const { addedNodes } of changes) {
        for (const node of addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          const added = node.dataset.paint ? [node, ...sprites(node)] : sprites(node);
          for (const sprite of added) {
            void paint(sprite.dataset.paint!, onShowPriority(sprite.dataset.paint!));
          }
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  const paintSprites = () => {
    paintSpritesOnShowThenBelow();
    paintSpritesTheBodyGains();
  };
  if (document.readyState === "loading") {
    addEventListener("DOMContentLoaded", paintSprites, { once: true });
  } else {
    paintSprites();
  }
}
