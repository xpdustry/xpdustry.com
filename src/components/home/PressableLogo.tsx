import { useEffect, useRef } from "react";
import logoSource from "#app/assets/logo.svg?raw";
import styles from "./PressableLogo.module.css";

/** Depth of the logo's extrusion, and the extra rise on hover, in logo units. */
const DEPTH = 30.72;
const LIFT = 19.2;
const LAYER = 0.96;
/** Frames between fully raised and pressed flat. */
const FRAMES = 24;

// The stock logo's extrusion, rebuilt deeper: one layer per LAYER from the pressed depth up to the
// hover lift, so the face can move anywhere in that range with the walls folding in under it.
const template = (() => {
  let svg = logoSource
    .slice(logoSource.indexOf("<svg"))
    .replace('role="img" aria-label="Xpdustry"', 'aria-hidden="true" focusable="false"')
    .replace(/\s*<title>.*?<\/title>/, "");
  for (const part of ["cog", "x"]) {
    svg = svg.replace(
      new RegExp(`(<g class="xp-w xp-w--${part}"[^>]*>).*?(</g>)`, "s"),
      `$1{{${part}}}$2`,
    );
  }
  return svg;
})();

const steps = Array.from(
  { length: Math.round(DEPTH / LAYER) + Math.round(LIFT / LAYER) + 1 },
  (_, index) => (Math.round(DEPTH / LAYER) - index) * LAYER,
);

/** The logo with its face `offset` logo units below its resting place: -LIFT raised, DEPTH flat. */
function logoAt(offset: number): string {
  const layers = (part: string) =>
    steps
      .map(
        (t) =>
          `<use href="#xp-${part}" transform="translate(0 ${Math.max(t, offset).toFixed(2)})"/>`,
      )
      .join("");
  return template
    .replace("{{cog}}", layers("cog"))
    .replace("{{x}}", layers("x"))
    .replaceAll('<g class="xp-f ', `<g transform="translate(0 ${offset.toFixed(2)})" class="xp-f `);
}

const RESTING = logoAt(0);

const ease = (t: number) => 1 - (1 - t) ** 4; // close to the plinths' cubic-bezier(.22,1,.36,1)

/**
 * The logo as a plinth: it rises on hover, presses flat, and pops back up. Moving ~100 layers
 * live would rebuild the SVG and re-run its outline blur every frame, so the states are rendered
 * once into bitmaps after hydration, and the animation only picks one to draw.
 */
export function PressableLogo({ className }: { className?: string }) {
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const mark = button.current!;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const size = Math.round(104 * Math.min(3, devicePixelRatio || 1));
    const abort = new AbortController();
    let raf = 0;

    void (async () => {
      const frames: HTMLCanvasElement[] = [];
      for (let i = 0; i <= FRAMES; i++) {
        const image = new Image();
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoAt(-LIFT + ((DEPTH + LIFT) * i) / FRAMES))}`;
        await image.decode();
        const frame = document.createElement("canvas");
        frame.width = frame.height = size;
        frame.getContext("2d")!.drawImage(image, 0, 0, size, size);
        frames.push(frame);
      }
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
        const index = Math.max(
          0,
          Math.min(FRAMES, Math.round(((offset + LIFT) / (DEPTH + LIFT)) * FRAMES)),
        );
        if (index === shown) return;
        context.clearRect(0, 0, size, size);
        context.drawImage(frames[index]!, 0, 0);
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

      const on = (type: string, listener: (event: Event) => void) =>
        mark.addEventListener(type, listener, { signal: abort.signal });
      on("pointerenter", () => ((hover = true), go()));
      on("pointerleave", () => ((hover = held = false), go()));
      on("pointerdown", () => ((held = true), go()));
      on("pointerup", () => ((held = false), go()));
      on("pointercancel", () => ((held = false), go()));
      on("keydown", (event) => {
        const key = (event as KeyboardEvent).key;
        if ((key === " " || key === "Enter") && !(event as KeyboardEvent).repeat) {
          event.preventDefault();
          held = true;
          go();
        }
      });
      on("keyup", (event) => {
        const key = (event as KeyboardEvent).key;
        if (key === " " || key === "Enter") {
          held = false;
          go();
        }
      });
      draw();
    })();

    return () => {
      abort.abort();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <button
      ref={button}
      type="button"
      className={`${styles.mark} ${className ?? ""}`}
      aria-label="Press the logo"
      // the resting logo, until the frames are ready
      dangerouslySetInnerHTML={{ __html: RESTING }}
    />
  );
}
