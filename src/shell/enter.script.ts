export default function enter(faceFrom: string, riseFrom: string): void {
  const paints = globalThis.paints;
  const root = document.documentElement;
  let motion: MediaQueryList;
  let still: boolean;
  try {
    motion = matchMedia("(prefers-reduced-motion: no-preference)");
    still = !motion.matches || !("animate" in root);
    root.dataset.enter = still ? "still" : "";
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
  const entering = new Set<Animation>();
  const held = new Set<HTMLElement>();
  const hold = (element: HTMLElement) => {
    element.dataset.held = "";
    held.add(element);
  };
  const show = (element: HTMLElement) => {
    held.delete(element);
    delete element.dataset.held;
  };
  const release = () => {
    for (const animation of waiting) animation.cancel();
    waiting.clear();
    for (const element of held) show(element);
    delete root.dataset.enter;
  };
  const releaseIfStalled = setTimeout(release, STALL_MS);
  const settle = () => {
    if (!waiting.size && !held.size) clearTimeout(releaseIfStalled);
  };
  addEventListener("pagehide", release, { once: true });

  const stopMoving = () => {
    still = true;
    for (const animation of entering) {
      if (animation.playState === "running") animation.finish();
    }
  };
  try {
    motion.addEventListener("change", () => motion.matches || stopMoving());
  } catch {}
  addEventListener("pagereveal", (event) => event.viewTransition && stopMoving());

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
    waitsForItsSprites?: boolean;
    restsUnpainted?: boolean;
    heldUntilPainted?: boolean;
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
      frames: [
        { "--opened": "0", offset: 0 },
        { "--opened": "0", offset: 0.45 },
        { "--opened": "1", offset: 1 }
      ],
      durationMs: 1000,
      earliestMs: 220,
      easing: EASE_SLOW_START,
      layers: [{}]
    },
    face: {
      frames: [{ translate: faceFrom, offset: 0 }],
      waitsForItsSprites: true,
      restsUnpainted: true,
      heldUntilPainted: true,
      durationMs: 900,
      earliestMs: 220,
      easing: EASE_SLOW_START,
      layers: [{ texture: "fringe" }]
    },
    rise: {
      frames: [{ maskPosition: riseFrom, offset: 0 }],
      restsUnpainted: true,
      durationMs: 900,
      earliestMs: 220,
      easing: EASE_SLOW_START,
      layers: [{ texture: "rise" }]
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
  const NO_TURN = { atMs: 0, trailMs: 0 };
  const turn = (card: Element | null, kind: string, earliestMs: number) => {
    if (!card) return { atMs: earliestMs, trailMs: 0 };
    if (!cardOrder.has(card)) cardOrder.set(card, cardOrder.size);
    const blob = Math.max(0, Math.min(blobIndex(card, kind), STAGGERED_BLOBS));
    const trailMs = blob * BLOB_STAGGER_MS;
    return { atMs: earliestMs + cardOrder.get(card)! * CARD_STAGGER_MS + trailMs, trailMs };
  };

  const spritesOf = (element: HTMLElement) =>
    [...element.querySelectorAll<HTMLElement>("[data-paint]")].map(
      (sprite) => sprite.dataset.paint!
    );
  const paintsOf = (element: HTMLElement, kind: Kind, texture?: string) => [
    ...(kind.waitsForItsSprites ? spritesOf(element) : []),
    element.dataset.paint ?? texture
  ];
  const showable = (keys: (string | undefined)[]) =>
    Promise.all(keys.map(showableImage)).then((images) =>
      images.every(Boolean) ? images[0] : undefined
    );

  const inView = (element: Element) => {
    const box = element.getBoundingClientRect();
    return box.bottom > 0 && box.top < innerHeight;
  };

  const animate = (element: HTMLElement, kind: Kind, pseudoElement?: string) => {
    const animation = element.animate(kind.frames, {
      duration: kind.durationMs,
      easing: kind.easing,
      fill: "backwards",
      pseudoElement
    });
    entering.add(animation);
    return animation;
  };

  const enterWhenPainted = (element: HTMLElement, kindName: string, startMs?: number) => {
    const kind = KINDS[kindName];
    if (!kind) return;
    const card = element.closest(".reveal");
    const onItsTurn = !still && startMs !== undefined && inView(card ?? element);
    if (!onItsTurn && !kind.heldUntilPainted) return;
    if (kind.heldUntilPainted) hold(element);
    const { atMs, trailMs } = onItsTurn ? turn(card, kindName, kind.earliestMs) : NO_TURN;
    kind.layers.forEach(({ pseudoElement, texture }, layer) => {
      const waited = onItsTurn ? animate(element, kind, pseudoElement) : undefined;
      if (waited) {
        waiting.add(waited);
        waited.pause();
      }
      const image = showable(paintsOf(element, kind, texture));
      void Promise.all([kind.growsThroughThreads && threadsImage, image]).then(
        ([threads, painted]) => {
          if (waited ? !waiting.delete(waited) : !held.has(element)) return;
          show(element);
          settle();
          const entersInView = painted && !still && startMs !== undefined && inView(element);
          const animation = waited ?? (entersInView ? animate(element, kind) : undefined);
          if (!animation) return;
          if (still || (kind.restsUnpainted && !painted)) return animation.finish();
          const effect = animation.effect as KeyframeEffect;
          if (kind.growsThroughThreads && threads) {
            effect.setKeyframes(growthFrames(element.dataset.tile!, threads));
          } else if (kind.growsThroughThreads) {
            effect.updateTiming({ duration: FADE_MS, easing: EASE_OUT });
          }
          const layerMs = layer * LAYER_STAGGER_MS;
          const untilTurnMs = startMs! + atMs + layerMs - performance.now();
          effect.updateTiming({ delay: waited ? Math.max(untilTurnMs, trailMs + layerMs) : 0 });
          animation.play();
        }
      );
    });
  };

  const holdFacesAddedLater = () =>
    new MutationObserver((changes) => {
      for (const { addedNodes } of changes) {
        for (const node of addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          for (const element of [node, ...node.querySelectorAll<HTMLElement>("[data-texture]")]) {
            if (!KINDS[element.dataset.texture!]?.heldUntilPainted) continue;
            enterWhenPainted(element, element.dataset.texture!);
            setTimeout(() => show(element), STALL_MS);
          }
        }
      }
    }).observe(document.body, { childList: true, subtree: true });

  const holdEachTextureInItsAnimation = () => {
    if (!("enter" in root.dataset)) return;
    const startMs = performance.now();
    try {
      for (const element of document.querySelectorAll<HTMLElement>("[data-texture]")) {
        enterWhenPainted(element, element.dataset.texture!, startMs);
      }
    } catch {
      release();
    }
    try {
      holdFacesAddedLater();
    } catch {}
    delete root.dataset.enter;
  };

  if (document.readyState === "loading") {
    addEventListener("DOMContentLoaded", holdEachTextureInItsAnimation, { once: true });
  } else {
    holdEachTextureInItsAnimation();
  }
}
