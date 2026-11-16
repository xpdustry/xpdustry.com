/**
 * Brings in the first screen's textures, those marked with `texture()`, in order as the painter
 * paints them: the crown and the backdrop, then each card's patches, card by card. A texture
 * painted late comes in when it is, never before its turn. A stalled painter releases textures
 * to show as they are painted. Content is never hidden: only textures wait, and only from here, in the
 * head, until the page is parsed. Without motion, or without the animation API, the textures
 * paint as they load.
 */
export default function enter(): void {
  const paints = globalThis.paints;
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
  // A stalled painter or module must not hold the page's textures indefinitely.
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
  const growth =
    (tile: string, threads: string) => (disc: string, outer: string, offset: number) => ({
      offset,
      maskImage: `${fused}, url("${threads}"), ${reach}`,
      maskComposite: "add, intersect",
      maskRepeat: "no-repeat, repeat, no-repeat",
      maskPosition: "50% 50%, 0 0, 50% 50%",
      maskSize: `${disc} ${disc}, ${tile}px ${tile}px, ${outer} ${outer}`
    });
  const images = new Map<string, Promise<boolean>>();
  const decode = (src: string) => {
    const loaded = images.get(src);
    if (loaded) return loaded;
    const image = new Image();
    image.src = src;
    const ready = image.decode().then(
      () => true,
      () => false
    );
    images.set(src, ready);
    return ready;
  };
  /** Resolves once a texture can show, to its image: painted and decoded, or absent. */
  const painted = (key?: string) =>
    Promise.resolve(key && paints ? paints(key) : undefined).then(
      (image) => image && decode(image).then((ready) => (ready ? image : undefined))
    );
  /** The thin threads a blob grows in through: its keyframes name them, so it waits for them too. */
  const threads = painted("threads");

  type Frames = Keyframe[] | ((tile: string, threads: string) => Keyframe[]);
  /** What holds a blob until it is painted, and all it plays when the threads are absent. */
  const fade: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];
  const grows = (animation: Animation, frames: Frames, tile?: string, threads?: string) => {
    if (typeof frames !== "function") return;
    const effect = animation.effect as KeyframeEffect;
    if (threads) effect.setKeyframes(frames(tile!, threads));
    else effect.updateTiming({ duration: 350, easing: ease });
  };

  /**
   * For each kind: its keyframes, or how to make them for a labyrinth tile; its duration; when in
   * the sequence it may start; its easing.
   */
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
      (tile, threads) => {
        const at = growth(tile, threads);
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

  /** The textures the styles name, for the kinds that are not a sprite: one per layer. */
  const NAMED: Record<string, string[]> = {
    drop: ["crown"],
    backdrop: ["backdrop-far", "backdrop-near"]
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
      const animation = element.animate(typeof frames === "function" ? fade : frames, {
        duration,
        easing,
        fill: "backwards",
        pseudoElement
      });
      waiting.add(animation);
      animation.pause();
      const image = painted(element.dataset.paint ?? NAMED[kind]?.[layer]);
      void Promise.all([typeof frames === "function" && threads, image]).then(([threads]) => {
        if (!waiting.delete(animation)) return;
        grows(animation, frames, element.dataset.tile, threads || undefined);
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
