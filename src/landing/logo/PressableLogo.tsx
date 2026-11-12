import { useEffect, useRef } from "react";
import { media } from "#app/ui/styles/media";
import { drawFrame, frameIndex, pressMotion, type Pointer } from "./frames";
import relief from "./logo-relief.webp";
import { loadLogoFrames } from "./relief";
import * as styles from "./PressableLogo.css";

const ease = (t: number) => 1 - (1 - t) ** 4;

export function PressableLogo({ className }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const mark = ref.current!;
    const abort = new AbortController();
    void loadLogoFrames().then((sheet) => {
      // Without its frames the logo stays the still image it started as.
      if (sheet && !abort.signal.aborted) animate(mark, sheet, abort.signal);
    });
    return () => abort.abort();
  }, []);

  return (
    <span ref={ref} className={`${styles.mark} ${className ?? ""}`} aria-hidden="true">
      <img src={relief} alt="" width={320} height={320} draggable={false} fetchPriority="high" />
    </span>
  );
}

/**
 * Swaps the still logo in `mark` for a canvas drawing the `sheet`'s frames, which rises under the
 * pointer and sinks under a press until `signal` aborts.
 */
function animate(mark: HTMLElement, sheet: HTMLImageElement, signal: AbortSignal) {
  const still = matchMedia(media.still).matches;
  const size = Math.round(104 * Math.min(3, devicePixelRatio || 1));
  const view = document.createElement("canvas");
  view.width = view.height = size;
  const context = view.getContext("2d")!;
  mark.replaceChildren(view);

  const pointer: Pointer = { hover: false, held: false };
  let offset = 0;
  let from = 0;
  let to = 0;
  let start = 0;
  let duration = 1;
  let shown = -1;
  let raf = 0;
  signal.addEventListener("abort", () => cancelAnimationFrame(raf));

  const draw = () => {
    const index = frameIndex(offset);
    if (index === shown) return;
    drawFrame(context, sheet, index);
    shown = index;
  };
  const tick = (now: number) => {
    // a frame's timestamp can predate `start`, as it is taken when the frame begins
    const progress = Math.max(0, Math.min(1, (now - start) / duration));
    offset = from + (to - from) * ease(progress);
    draw();
    raf = progress < 1 ? requestAnimationFrame(tick) : 0;
  };
  const go = () => {
    from = offset;
    ({ offset: to, duration } = pressMotion(pointer));
    if (still) {
      offset = to;
      return draw();
    }
    start = performance.now();
    raf ||= requestAnimationFrame(tick);
  };

  const on = (type: string, change: Partial<Pointer>) =>
    mark.addEventListener(type, () => (Object.assign(pointer, change), go()), { signal });
  on("pointerenter", { hover: true });
  on("pointerleave", { hover: false, held: false });
  on("pointerdown", { held: true });
  on("pointerup", { held: false });
  on("pointercancel", { held: false });
  draw();
}
