import { useEffect } from "react";

/** How far, in px, from a card's edge the pointer starts to light it. */
const REACH = 220;

/**
 * Lights the edge of every `.spot` card the pointer comes near, brightest at the closest point.
 * Cards out of reach are left alone: every write restyles the card and repaints its glow.
 */
export function useSpotlight(): void {
  useEffect(() => {
    if (matchMedia("(pointer: coarse)").matches) return;
    const lit = new WeakMap<Element, string>();
    let frame = 0;
    let x = 0;
    let y = 0;

    const update = () => {
      frame = 0;
      for (const card of document.querySelectorAll<HTMLElement>(".spot")) {
        const rect = card.getBoundingClientRect();
        const dx = Math.max(rect.left - x, 0, x - rect.right);
        const dy = Math.max(rect.top - y, 0, y - rect.bottom);
        const glow = Math.max(0, 1 - Math.hypot(dx, dy) / REACH).toFixed(3);
        if (glow === "0.000" && (lit.get(card) ?? "0.000") === glow) continue;
        lit.set(card, glow);
        card.style.setProperty("--spot-x", `${x - rect.left}px`);
        card.style.setProperty("--spot-y", `${y - rect.top}px`);
        card.style.setProperty("--spot", glow);
      }
    };
    const move = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      frame ||= requestAnimationFrame(update);
    };

    addEventListener("pointermove", move, { passive: true });
    return () => {
      removeEventListener("pointermove", move);
      cancelAnimationFrame(frame);
    };
  }, []);
}
