import { useEffect } from "react";

const REACH = 220;
const DARK = "0.000";

export function useSpotlight(): void {
  useEffect(() => {
    if (matchMedia("(pointer: coarse)").matches) return;
    const lit = new WeakMap<Element, string>();
    let frame = 0;
    let x = 0;
    let y = 0;

    const staysDark = (card: Element, glow: string) =>
      glow === DARK && (lit.get(card) ?? DARK) === DARK;

    const update = () => {
      frame = 0;
      for (const card of document.querySelectorAll<HTMLElement>(".spot")) {
        const rect = card.getBoundingClientRect();
        const dx = Math.max(rect.left - x, 0, x - rect.right);
        const dy = Math.max(rect.top - y, 0, y - rect.bottom);
        const glow = Math.max(0, 1 - Math.hypot(dx, dy) / REACH).toFixed(3);
        if (staysDark(card, glow)) continue;
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
