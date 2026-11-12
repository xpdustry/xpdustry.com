import type { CSSProperties } from "react";
import { blobSprite, type Patches as PatchesData } from "#app/data/textures";
import styles from "./Patches.module.css";

const SPRITES = import.meta.glob<string>("/src/assets/patches/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});

/**
 * A card's patches of labyrinth, each blob a sprite `pnpm textures` rendered, so they paint with
 * the page. By default they fill their positioned parent, behind the content. Growing patches
 * lay each blob's grown sprite over it, uncovered from the middle out while the card is hovered.
 */
export function Patches({ patches, className }: { patches: PatchesData; className?: string }) {
  return (
    <span className={`${styles.patches} ${className ?? ""}`} aria-hidden="true">
      {patches.blobs.map(([x, y, radius, turn = 0], at) => {
        const style: CSSProperties = {
          left: `${x * 100}%`,
          top: `${y * 100}%`,
          transform: turn
            ? `rotate(${(turn % 4) * 90}deg) scaleX(${turn < 4 ? 1 : -1})`
            : undefined,
        };
        return (
          <span key={at}>
            <Sprite sprite={blobSprite(patches, radius)} style={style} />
            {patches.grow && (
              <Sprite
                sprite={blobSprite(patches, radius, true)}
                style={style}
                className={styles.grown}
              />
            )}
          </span>
        );
      })}
    </span>
  );
}

function Sprite({
  sprite,
  style,
  className,
}: {
  sprite: ReturnType<typeof blobSprite>;
  style: CSSProperties;
  className?: string;
}) {
  return (
    <img
      className={className}
      src={SPRITES[`/src/assets/patches/${sprite.name}.webp`]}
      width={sprite.size}
      height={sprite.size}
      alt=""
      loading="lazy"
      decoding="async"
      style={style}
    />
  );
}
