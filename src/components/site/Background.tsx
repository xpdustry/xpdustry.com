import { useEffect } from "react";
import { Texture } from "#app/components/ui/Texture";
import type { TextureSettings } from "#app/data/textures";
import styles from "./Background.module.css";

// One seamless tile of scattered labyrinth, darker than the page, repeated under everything.
const PATTERN: TextureSettings = {
  repeat: 900,
  tile: 300,
  hard: 6,
  color: "#1b6a65",
  inner: "#18625d",
  noise: { scale: 4, amp: 6, bias: 0.5 },
};

/**
 * The page's backdrop. It scrolls at a third of the page's speed: a scroll-driven animation moves
 * it one tile per 2700 px of scroll and repeats, so it wraps seamlessly. Browsers without
 * scroll-driven animations get the same motion from a scroll listener.
 */
export function Background() {
  useEffect(() => {
    if (CSS.supports("animation-timeline: scroll()")) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const layer = document.getElementById("bg")!;
    const move = () => {
      layer.style.transform = `translateY(${-((scrollY / 3) % PATTERN.repeat!)}px)`;
    };
    addEventListener("scroll", move, { passive: true });
    move();
    return () => removeEventListener("scroll", move);
  }, []);

  return (
    <div id="bg" className={styles.background}>
      <Texture settings={PATTERN} className={styles.pattern} />
    </div>
  );
}
