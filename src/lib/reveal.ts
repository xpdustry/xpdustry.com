import far from "#app/assets/backdrop-far.webp";
import near from "#app/assets/backdrop-near.webp";
import crown from "#app/assets/crown.webp";
import ridge from "#app/assets/ridge.webp";

/** The page's frame, top and bottom: it waits for these, and nothing else, before it shows. */
export const FRAME_IMAGES = [crown, ridge];
/** The backdrop's tiles, which fade in when they are in, while the blocks rise. */
const BACKDROP = [far, near];
/** The faces the first screen sets, as `document.fonts.load` takes them. */
const FONTS = [
  '16px "Momo Trust Display"',
  '16px "Momo Trust Sans Variable"',
  '500 16px "DM Mono"',
];
/** Both, for the head to preload. */
export const REVEAL_IMAGES = [...FRAME_IMAGES, ...BACKDROP];

/** Between each block's start, and how long each takes to rise in, in ms. */
const STAGGER = 70;
const DURATION = 600;
const BACKDROP_FADE = 900;
const IMAGE_FADE = 400;
/** The longest the blocks wait for the frame before showing anyway. */
const MAX_WAIT = 2500;

/**
 * Hides the page's blocks (`.reveal`) until the crown, the footer's ridge and the fonts are in, then raises
 * those on screen in one after the other; the rest just show. The backdrop (`[data-backdrop]`)
 * stays hidden until its own tiles are in, then fades in, so it never holds the page back. Images
 * in the blocks that arrive after that fade in as they do, instead of popping.
 *
 * Inlined in the head, so it runs before the body paints and needs no hydration; it animates
 * through the Web Animations API, so it never touches the elements React is about to hydrate.
 * Plain JavaScript in a string, so the server and the browser inline the very same text.
 */
export const REVEAL = `(() => {
  const root = document.documentElement;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.dataset.waitFrame = "";
  root.dataset.waitBackdrop = "";
  const load = (srcs) => Promise.all(srcs.map((src) => {
    const image = new Image();
    image.src = src;
    return image.decode().catch(() => {});
  }));
  const parsed = new Promise((resolve) => {
    if (document.readyState === "loading") addEventListener("DOMContentLoaded", resolve, { once: true });
    else resolve();
  });
  const timeout = new Promise((resolve) => setTimeout(resolve, ${MAX_WAIT}));
  const easing = "cubic-bezier(0.22, 1, 0.36, 1)";

  // the faces the first screen sets, so none swaps in while the blocks rise
  const fonts = ${JSON.stringify(FONTS)}.map((font) => document.fonts.load(font).catch(() => {}));
  const frame = Promise.all([load(${JSON.stringify(FRAME_IMAGES)}), ...fonts]);
  const shown = Promise.race([frame, timeout]).then(() => parsed).then(() => {
    if (!still) {
      let order = 0;
      for (const block of document.querySelectorAll(".reveal")) {
        const rect = block.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top >= innerHeight) continue;
        block.animate(
          [{ opacity: 0, translate: "0 18px" }, { opacity: 1, translate: "0 0" }],
          { duration: ${DURATION}, delay: order++ * ${STAGGER}, easing, fill: "backwards" },
        );
      }
    }
    delete root.dataset.waitFrame;
    if (!still) {
      addEventListener("load", (event) => {
        const image = event.target;
        if (image instanceof HTMLImageElement && image.closest(".reveal")) {
          image.animate({ opacity: [0, 1] }, { duration: ${IMAGE_FADE}, easing: "ease-out" });
        }
      }, true);
    }
  });

  Promise.all([load(${JSON.stringify(BACKDROP)}), shown]).then(() => {
    const backdrop = document.querySelector("[data-backdrop]");
    if (backdrop && !still) {
      backdrop.animate({ opacity: [0, 1] }, { duration: ${BACKDROP_FADE}, easing: "ease-out", fill: "backwards" });
    }
    delete root.dataset.waitBackdrop;
  });
})()`;
