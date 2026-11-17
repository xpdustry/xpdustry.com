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

  const STALL_MS = 4000;
  const CARD_STAGGER_MS = 110;
  const BLOB_STAGGER_MS = 70;
  const STAGGERED_BLOBS = 4;
  const LAYER_STAGGER_MS = 140;
  const FADE_MS = 350;
  const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
  const EASE_SLOW_START = "cubic-bezier(0.33, 0, 0.2, 1)";

  const waiting = new Set<Animation>();
  const release = () => {
    for (const animation of waiting) animation.cancel();
    waiting.clear();
    delete root.dataset.enter;
  };
  const releaseIfStalled = setTimeout(release, STALL_MS);
  addEventListener("pagehide", release, { once: true });

  const decoded = new Map<string, Promise<boolean>>();
  const decode = (src: string) => {
    const known = decoded.get(src);
    if (known) return known;
    const image = new Image();
    image.src = src;
    const ready = image.decode().then(
      () => true,
      () => false
    );
    decoded.set(src, ready);
    return ready;
  };
  const showableImage = (key?: string) =>
    Promise.resolve(key && paints ? paints(key) : undefined).then(
      (image) => image && decode(image).then((ready) => (ready ? image : undefined))
    );
  const threadsImage = showableImage("threads");

  const FUSED_DISC = "radial-gradient(closest-side, #000 82%, transparent)";
  const THREAD_REACH = "radial-gradient(closest-side, #000 60%, transparent)";
  const growthFrames = (tile: string, threads: string): Keyframe[] => {
    const frame = ({ offset, fused, reach }: { offset: number; fused: string; reach: string }) => ({
      offset,
      maskImage: `${FUSED_DISC}, url("${threads}"), ${THREAD_REACH}`,
      maskComposite: "add, intersect",
      maskRepeat: "no-repeat, repeat, no-repeat",
      maskPosition: "50% 50%, 0 0, 50% 50%",
      maskSize: `${fused} ${fused}, ${tile}px ${tile}px, ${reach} ${reach}`
    });
    return [
      frame({ offset: 0, fused: "0%", reach: "0%" }),
      frame({ offset: 0.25, fused: "0%", reach: "90%" }),
      frame({ offset: 1, fused: "190%", reach: "320%" })
    ];
  };

  interface Kind {
    frames: Keyframe[];
    growsThroughThreads?: boolean;
    durationMs: number;
    earliestMs: number;
    easing: string;
    layers: { pseudoElement?: string; texture?: string }[];
  }
  const FADE_IN: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];
  const KINDS: Record<string, Kind> = {
    drop: {
      frames: [
        { opacity: 0, translate: "0 -18px" },
        { opacity: 1, translate: "0 0" }
      ],
      durationMs: 550,
      earliestMs: 0,
      easing: EASE_OUT,
      layers: [{ texture: "crown" }]
    },
    backdrop: {
      frames: FADE_IN,
      durationMs: 900,
      earliestMs: 80,
      easing: EASE_OUT,
      layers: [
        { pseudoElement: "::before", texture: "backdrop-far" },
        { pseudoElement: "::after", texture: "backdrop-near" }
      ]
    },
    grow: {
      frames: FADE_IN,
      growsThroughThreads: true,
      durationMs: 1000,
      earliestMs: 220,
      easing: EASE_SLOW_START,
      layers: [{}]
    },
    grown: {
      // No keyframe at 1: Web Animations fills it with the underlying value, where the hover has
      // `--grow`. https://drafts.csswg.org/web-animations-1/#the-effect-value-of-a-keyframe-animation-effect
      frames: [
        { "--grow": "0", offset: 0 },
        { "--grow": "0", offset: 0.45 }
      ],
      durationMs: 1000,
      earliestMs: 220,
      easing: EASE_SLOW_START,
      layers: [{}]
    }
  };

  const cardOrder = new Map<Element, number>();
  const blobsTaken = new Map<Element, number>();
  const blobIndex = (card: Element, kind: string) => {
    const taken = blobsTaken.get(card) ?? 0;
    const sharesItsBlobsTurn = kind === "grown";
    if (sharesItsBlobsTurn) return taken - 1;
    blobsTaken.set(card, taken + 1);
    return taken;
  };
  const turn = (card: Element | null, kind: string, earliestMs: number) => {
    if (!card) return { atMs: earliestMs, trailMs: 0 };
    if (!cardOrder.has(card)) cardOrder.set(card, cardOrder.size);
    const blob = Math.max(0, Math.min(blobIndex(card, kind), STAGGERED_BLOBS));
    const trailMs = blob * BLOB_STAGGER_MS;
    return { atMs: earliestMs + cardOrder.get(card)! * CARD_STAGGER_MS + trailMs, trailMs };
  };

  const enterWhenPainted = (element: HTMLElement, kindName: string, startMs: number) => {
    const kind = KINDS[kindName];
    if (!kind) return;
    const card = element.closest(".reveal");
    const box = (card ?? element).getBoundingClientRect();
    if (box.bottom <= 0 || box.top >= innerHeight) return;
    const { atMs, trailMs } = turn(card, kindName, kind.earliestMs);
    kind.layers.forEach(({ pseudoElement, texture }, layer) => {
      const animation = element.animate(kind.frames, {
        duration: kind.durationMs,
        easing: kind.easing,
        fill: "backwards",
        pseudoElement
      });
      waiting.add(animation);
      animation.pause();
      const image = showableImage(element.dataset.paint ?? texture);
      void Promise.all([kind.growsThroughThreads && threadsImage, image]).then(([threads]) => {
        if (!waiting.delete(animation)) return;
        const effect = animation.effect as KeyframeEffect;
        if (kind.growsThroughThreads && threads) {
          effect.setKeyframes(growthFrames(element.dataset.tile!, threads));
        } else if (kind.growsThroughThreads) {
          effect.updateTiming({ duration: FADE_MS, easing: EASE_OUT });
        }
        if (!waiting.size) clearTimeout(releaseIfStalled);
        const layerMs = layer * LAYER_STAGGER_MS;
        const untilTurnMs = startMs + atMs + layerMs - performance.now();
        effect.updateTiming({ delay: Math.max(untilTurnMs, trailMs + layerMs) });
        animation.play();
      });
    });
  };

  const holdEachTextureInItsAnimation = () => {
    if (!("enter" in root.dataset)) return;
    const startMs = performance.now();
    try {
      for (const element of document.querySelectorAll<HTMLElement>("[data-texture]")) {
        enterWhenPainted(element, element.dataset.texture!, startMs);
      }
    } catch {}
    delete root.dataset.enter;
  };

  if (document.readyState === "loading") {
    addEventListener("DOMContentLoaded", holdEachTextureInItsAnimation, { once: true });
  } else {
    holdEachTextureInItsAnimation();
  }
}
