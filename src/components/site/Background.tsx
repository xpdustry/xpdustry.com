import { media } from "#app/styles/media";
import * as styles from "./Background.css";

/**
 * Where scroll-driven animations are missing (Firefox), drifts the backdrop from a scroll
 * listener instead. Inlined after the backdrop, so it runs as the page parses: the backdrop is in
 * place on a reload's first paint rather than at hydration. Self-contained, as it is stringified.
 */
function drift(element: HTMLElement, query: string, tile: number, far: number, near: number) {
  if (CSS.supports("animation-timeline: scroll()")) return;
  const motion = matchMedia(query);
  let frame = 0;
  const update = () => {
    frame = 0;
    element.style.setProperty("--far", `${-((scrollY / far) % tile)}px`);
    element.style.setProperty("--near", `${-((scrollY / near) % tile)}px`);
  };
  const scroll = () => {
    frame ||= requestAnimationFrame(update);
  };
  const toggle = () => {
    removeEventListener("scroll", scroll);
    cancelAnimationFrame(frame);
    frame = 0;
    if (motion.matches) {
      element.dataset.drift = "";
      update();
      addEventListener("scroll", scroll, { passive: true });
    } else delete element.dataset.drift;
  };
  toggle();
  motion.addEventListener("change", toggle);
}

const DRIFT = `(${drift.toString()})(document.currentScript.previousElementSibling, ${JSON.stringify(media.motion)}, ${styles.TILE}, ${styles.FAR}, ${styles.NEAR})`;

/**
 * The page's backdrop, painted from CSS with the page: dark colonies far behind and lighter ones
 * nearer, scrolling at different speeds. Scroll-driven animations drift them on the compositor;
 * where those are missing, `drift` does, a frame behind at worst. Over them, at the top of the
 * page, deep teal frays down into the backdrop, as the footer's ridge grows up out of it.
 */
export function Background() {
  return (
    <>
      {/* the script sets the drift before hydration */}
      <div
        className={styles.background}
        data-backdrop=""
        aria-hidden="true"
        suppressHydrationWarning
      />
      <script dangerouslySetInnerHTML={{ __html: DRIFT }} />
      <div className={styles.crown} data-crown="" aria-hidden="true" />
    </>
  );
}
