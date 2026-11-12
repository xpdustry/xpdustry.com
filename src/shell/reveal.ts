import far from "#app/textures/assets/backdrop-far.webp";
import near from "#app/textures/assets/backdrop-near.webp";
import crown from "#app/textures/assets/crown.webp";
import ridge from "#app/textures/assets/ridge.webp";
import { inlineScript } from "./inlineScript";

export const FRAME_IMAGES = [crown, ridge];
export const REVEAL_IMAGES = [...FRAME_IMAGES, far, near];

function reveal(): void {
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
          fill: "backwards"
        });
      }
    } catch {}
  };

  if (document.readyState === "loading") {
    addEventListener("DOMContentLoaded", show, { once: true });
  } else {
    show();
  }
}

export const REVEAL = inlineScript(reveal);
