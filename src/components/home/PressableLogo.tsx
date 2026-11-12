import { useEffect, useRef } from "react";
import relief from "#app/assets/logo-relief.webp";
import { DEPTH, LIFT, drawFrame, frameIndex } from "#app/lib/logo";
import { loadLogoFrames } from "#app/lib/relief";
import { media } from "#app/styles/media";
import * as styles from "./PressableLogo.css";

const ease = (t: number) => 1 - (1 - t) ** 4; // close to the plinths' cubic-bezier(.22,1,.36,1)

/**
 * The logo as a plinth: it rises under the pointer, presses flat, and pops back up, drawn from the
 * relief logo's pre-rendered frames. A toy for the pointer alone: pressing it does nothing, so it
 * is no button, and hidden from assistive tech beside the name it stands next to.
 */
export function PressableLogo({ className }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const mark = ref.current!;
    const still = matchMedia(media.still).matches;
    const size = Math.round(104 * Math.min(3, devicePixelRatio || 1));
    const abort = new AbortController();
    let raf = 0;

    void (async () => {
      const sheet = await loadLogoFrames();
      if (abort.signal.aborted) return;

      const view = document.createElement("canvas");
      view.width = view.height = size;
      const context = view.getContext("2d")!;
      mark.replaceChildren(view);

      let offset = 0;
      let from = 0;
      let to = 0;
      let start = 0;
      let duration = 1;
      let shown = -1;
      let hover = false;
      let held = false;

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
        to = held ? DEPTH : hover ? -LIFT : 0;
        if (still) {
          offset = to;
          return draw();
        }
        duration = held ? 60 : 190;
        start = performance.now();
        raf ||= requestAnimationFrame(tick);
      };

      const on = (type: string, listener: () => void) =>
        mark.addEventListener(type, listener, { signal: abort.signal });
      on("pointerenter", () => ((hover = true), go()));
      on("pointerleave", () => ((hover = held = false), go()));
      on("pointerdown", () => ((held = true), go()));
      on("pointerup", () => ((held = false), go()));
      on("pointercancel", () => ((held = false), go()));
      draw();
    })();

    return () => {
      abort.abort();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <span ref={ref} className={`${styles.mark} ${className ?? ""}`} aria-hidden="true">
      {/* at rest, until the frames are ready */}
      <img src={relief} alt="" width={320} height={320} draggable={false} fetchPriority="high" />
    </span>
  );
}
