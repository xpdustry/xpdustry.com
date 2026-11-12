import styles from "./Background.module.css";

/** Scroll per 900 px tile of drift: the far layer moves at a sixth of the page's speed, the near at a third. */
const FAR = 6;
const NEAR = 3;

/**
 * Where scroll-driven animations are missing (Firefox), drifts the backdrop from a scroll
 * listener instead. Inlined after the backdrop, so it runs as the page parses: the backdrop is in
 * place on a reload's first paint rather than at hydration. Self-contained, as it is stringified.
 */
function drift(element: HTMLElement, far: number, near: number) {
  if (CSS.supports("animation-timeline: scroll()")) return;
  const motion = matchMedia("(prefers-reduced-motion: no-preference)");
  let frame = 0;
  const update = () => {
    frame = 0;
    element.style.setProperty("--far", `${-((scrollY / far) % 900)}px`);
    element.style.setProperty("--near", `${-((scrollY / near) % 900)}px`);
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

const DRIFT = `(${drift.toString()})(document.currentScript.previousElementSibling, ${FAR}, ${NEAR})`;

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
