import { useEffect, useRef } from "react";
import type { TextureSettings } from "#app/data/textures";
import { attachDrift } from "#app/lib/reticulate/drift";
import { requestTexture } from "#app/lib/reticulate/textures";
import styles from "./Texture.module.css";

export interface TextureProps {
  settings: TextureSettings;
  /** Positions the texture; by default it fills its positioned parent, behind the content. */
  className?: string;
  /** Let the blobs drift while on screen; `solo` keeps each blob whole, only roaming. */
  drift?: boolean | "solo";
}

/**
 * The reticulate pattern, rendered in a worker to the element's size once fonts are in and again
 * after a resize. The server sends an empty layer; the pattern fades in after hydration.
 */
export function Texture({ settings, className, drift = false }: TextureProps) {
  const still = useRef<HTMLSpanElement>(null);
  const live = useRef<HTMLCanvasElement>(null);
  const key = JSON.stringify(settings);

  useEffect(() => {
    const element = still.current!;
    const parsed = JSON.parse(key) as TextureSettings;
    let latest = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const paint = async () => {
      const request = ++latest;
      await document.fonts.ready;
      const rect = element.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      if (!parsed.repeat && (!width || !height)) return;

      const url = await requestTexture(fitted(element, rect, parsed), width, height);
      if (request !== latest) return;
      element.style.backgroundImage = `url(${url})`;
      element.dataset.painted = "";
    };

    void paint();
    if (parsed.repeat) return () => void latest++;

    // the first callback reports the size just painted for
    let first = true;
    const observer = new ResizeObserver(() => {
      if (first) return void (first = false);
      clearTimeout(timer);
      timer = setTimeout(paint, 150);
    });
    observer.observe(element);
    return () => {
      latest++;
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [key]);

  useEffect(() => {
    if (!drift) return;
    return attachDrift(still.current!, live.current!, JSON.parse(key), drift === "solo");
  }, [key, drift]);

  const repeat = settings.repeat ? { backgroundSize: `${settings.repeat}px` } : undefined;
  return (
    <>
      <span
        ref={still}
        className={`${styles.texture} ${repeat ? styles.repeat : ""} ${className ?? ""}`}
        style={repeat}
        aria-hidden="true"
      />
      {drift && (
        <canvas
          ref={live}
          className={`${styles.texture} ${styles.live} ${className ?? ""}`}
          aria-hidden="true"
        />
      )}
    </>
  );
}

/**
 * Resolves a `fit` into a ramp that turns solid `gap` px above the card's title (wave crests
 * included) and fades in over `fade` px. The title is the first visible heading or `[data-fit]`.
 */
function fitted(element: HTMLElement, rect: DOMRect, settings: TextureSettings): TextureSettings {
  if (!settings.fit) return settings;
  const { fit, ...rest } = settings;
  const title = [...(element.parentElement?.querySelectorAll("h1, h2, h3, [data-fit]") ?? [])].find(
    (candidate) => candidate.getClientRects().length > 0,
  );
  if (!title) return rest;

  const top = Math.round(title.getBoundingClientRect().top - rect.top);
  const to = Math.max(0.05, (top - fit[0]) / rect.height - (settings.wave?.[0] ?? 0));
  return { ...rest, ramp: [Math.max(0, to - fit[1] / rect.height), to] };
}
