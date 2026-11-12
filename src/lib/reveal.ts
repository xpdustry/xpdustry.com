import far from "#app/assets/backdrop-far.webp";
import near from "#app/assets/backdrop-near.webp";
import crown from "#app/assets/crown.webp";
import ridge from "#app/assets/ridge.webp";

/** The page's frame, for the head to preload. */
export const FRAME_IMAGES = [crown, ridge];
/** The frame and backdrop tiles, for the head to preload. */
export const REVEAL_IMAGES = [...FRAME_IMAGES, far, near];

/**
 * A progressive enhancement: content paints immediately, without waiting for images or fonts.
 * Only position animates, so a missing API, stalled callback or exception cannot hide the page.
 * Keep this function self-contained: the head inlines it before hydration.
 */
export function reveal(): void {
  const show = () => {
    try {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      let order = 0;
      for (const block of document.querySelectorAll<HTMLElement>(".reveal")) {
        const rect = block.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top >= innerHeight) continue;
        block.animate([{ translate: "0 12px" }, { translate: "0 0" }], {
          duration: 350,
          delay: Math.min(order++ * 40, 120),
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "backwards",
        });
      }
    } catch {
      // Motion is optional; the page is already visible.
    }
  };

  if (document.readyState === "loading") {
    addEventListener("DOMContentLoaded", show, { once: true });
  } else {
    show();
  }
}

export const REVEAL = `(${reveal.toString()})()`;
