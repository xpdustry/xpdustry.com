import threads from "#app/textures/assets/threads.webp";
import { inlineScript } from "./inlineScript";

/**
 * Brings in the first screen's textures, those marked with `texture()`, in order as their images
 * arrive: the crown and the backdrop, then each card's patches, card by card. A texture whose
 * image is late comes in when it lands, never before its turn. A stalled load releases textures
 * to paint normally. Content is never hidden: only textures wait, and only from here, in the
 * head, until the page is parsed. Without motion, or without the animation API, the textures
 * paint as they load.
 */
function enter(threads: string): void {
  const root = document.documentElement;
  try {
    if (!matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
    if (!("animate" in root)) return;
    root.dataset.enter = "";
  } catch {
    return;
  }

  const waiting = new Set<Animation>();
  const release = () => {
    for (const animation of waiting) animation.cancel();
    waiting.clear();
    delete root.dataset.enter;
  };
  // A stalled image or module must not hold the page's textures indefinitely.
  const timeout = setTimeout(release, 4000);
  addEventListener("pagehide", release, { once: true });

  const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
  /** Slower out of the start, so the threads show before they fuse. */
  const steady = "cubic-bezier(0.33, 0, 0.2, 1)";

  /**
   * A patch's blob grows as the labyrinth does: threads reach out first, then fuse into the
   * patch behind them. Its mask adds a fused disc to threads cut to a wider disc, both widening
   * from the blob's middle until the fused one covers the whole sprite.
   */
  const fused = "radial-gradient(closest-side, #000 82%, transparent)";
  const reach = "radial-gradient(closest-side, #000 60%, transparent)";
  const growth = (tile: string) => (disc: string, outer: string, offset: number) => ({
    offset,
    maskImage: `${fused}, url("${threads}"), ${reach}`,
    maskComposite: "add, intersect",
    maskRepeat: "no-repeat, repeat, no-repeat",
    maskPosition: "50% 50%, 0 0, 50% 50%",
    maskSize: `${disc} ${disc}, ${tile}px ${tile}px, ${outer} ${outer}`
  });
  const threadsReady = (() => {
    const image = new Image();
    image.src = threads;
    return image.decode().catch(() => {});
  })();

  /**
   * For each kind: its keyframes, or how to make them for a labyrinth tile; its duration; when in
   * the sequence it may start; its easing.
   */
  type Frames = Keyframe[] | ((tile: string) => Keyframe[]);
  const KINDS: Record<string, [Frames, number, number, string?]> = {
    drop: [
      [
        { opacity: 0, translate: "0 -18px" },
        { opacity: 1, translate: "0 0" }
      ],
      550,
      0
    ],
    backdrop: [[{ opacity: 0 }, { opacity: 1 }], 900, 80],
    grow: [
      (tile) => {
        const at = growth(tile);
        return [at("0%", "0%", 0), at("0%", "90%", 0.25), at("190%", "320%", 1)];
      },
      1000,
      220,
      steady
    ],
    // Its grown sprite, which the hover uncovers, opens from nothing to where it rests, inside the
    // fused disc. Without a last keyframe, it ends wherever the hover has it.
    grown: [
      [
        { "--grow": "0", offset: 0 },
        { "--grow": "0", offset: 0.45 }
      ],
      1000,
      220,
      steady
    ]
  };
  const CARD = 110;
  const BLOB = 70;

  /** Resolves once `element`'s image, or its background's, can paint, whether it loaded or not. */
  const ready = (element: Element, pseudo?: string): Promise<unknown> => {
    if (element instanceof HTMLImageElement) {
      const loaded = element.complete
        ? Promise.resolve()
        : new Promise((done) => {
            element.addEventListener("load", done, { once: true });
            element.addEventListener("error", done, { once: true });
          });
      return loaded.then(() => element.decode()).catch(() => {});
    }
    const url = /url\(["']?(.*?)["']?\)/.exec(getComputedStyle(element, pseudo).backgroundImage);
    if (!url) return Promise.resolve();
    const image = new Image();
    image.src = url[1]!;
    return image.decode().catch(() => {});
  };

  const cards = new Map<Element, number>();
  const blobs = new Map<Element, number>();

  /**
   * When a texture may start, in ms from `start`, and how far it trails its card's earlier blobs
   * if its image is late. A blob's grown sprite comes in with it: only base sprites take a turn.
   */
  const turn = (card: Element | null, kind: string, at: number): [number, number] => {
    if (!card) return [at, 0];
    if (!cards.has(card)) cards.set(card, cards.size);
    const blob = blobs.get(card) ?? 0;
    if (kind !== "grown") blobs.set(card, blob + 1);
    const trail = Math.max(0, Math.min(kind === "grown" ? blob - 1 : blob, 4)) * BLOB;
    return [at + cards.get(card)! * CARD + trail, trail];
  };

  /** Holds `element` at its first keyframe until its image can paint and its turn has come. */
  const play = (element: HTMLElement, kind: string, start: number) => {
    if (!KINDS[kind]) return;
    const [frames, duration, at, easing = ease] = KINDS[kind];
    const card = element.closest(".reveal");
    const box = (card ?? element).getBoundingClientRect();
    if (box.bottom <= 0 || box.top >= innerHeight) return;
    const [slot, trail] = turn(card, kind, at);
    const layers = kind === "backdrop" ? ["::before", "::after"] : [undefined];
    layers.forEach((pseudoElement, layer) => {
      const keyframes = typeof frames === "function" ? frames(element.dataset.tile!) : frames;
      const animation = element.animate(keyframes, {
        duration,
        easing,
        fill: "backwards",
        pseudoElement
      });
      waiting.add(animation);
      animation.pause();
      const painted = ready(element, pseudoElement);
      void (kind === "grow" ? Promise.all([painted, threadsReady]) : painted).then(() => {
        if (!waiting.delete(animation)) return;
        if (!waiting.size) clearTimeout(timeout);
        const wait = start + slot + layer * 140 - performance.now();
        animation.effect!.updateTiming({ delay: Math.max(wait, trail + layer * 140) });
        animation.play();
      });
    });
  };

  const run = () => {
    if (!("enter" in root.dataset)) return;
    const start = performance.now();
    try {
      for (const element of document.querySelectorAll<HTMLElement>("[data-texture]")) {
        play(element, element.dataset.texture!, start);
      }
    } catch {}
    // Each waiting texture is now held by its animation, which outranks this.
    delete root.dataset.enter;
  };

  if (document.readyState === "loading") {
    addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
}

export const ENTER = inlineScript(enter, threads);
