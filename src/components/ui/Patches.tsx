import type { CSSProperties } from "react";
import { blobSprite, type Patches as PatchesData } from "#app/lib/textures";
import * as styles from "./Patches.css";

const SPRITES = import.meta.glob<string>("/src/assets/patches/*.webp", {
  eager: true,
  query: "?url",
  import: "default"
});

/**
 * A card's patches of labyrinth, each blob a sprite `pnpm textures` rendered, so they paint with
 * the page. By default they fill their positioned parent, behind the content. Growing patches
 * lay each blob's grown sprite over it, uncovered from the middle out while the card is hovered.
 *
 * A card whose sprites are the largest thing on the first screen passes `priority`: they load at
 * once and ahead of other images, instead of when layout finds them near the viewport. Its grown
 * sprites still wait. Elsewhere it only takes bandwidth from the fonts the first screen needs.
 */
export function Patches({
  patches,
  className,
  priority = false
}: {
  patches: PatchesData;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={`${styles.patches} ${className ?? ""}`} aria-hidden="true">
      {patches.blobs.map(([x, y, radius, turn = 0], at) => {
        const style: CSSProperties = {
          left: `${x * 100}%`,
          top: `${y * 100}%`,
          transform: turn ? `rotate(${(turn % 4) * 90}deg) scaleX(${turn < 4 ? 1 : -1})` : undefined
        };
        return (
          <span key={at}>
            <Sprite sprite={blobSprite(patches, radius)} style={style} priority={priority} />
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
  priority = false
}: {
  sprite: ReturnType<typeof blobSprite>;
  style: CSSProperties;
  className?: string;
  priority?: boolean;
}) {
  return (
    <img
      className={className}
      src={SPRITES[`/src/assets/patches/${sprite.name}.webp`]}
      width={sprite.size}
      height={sprite.size}
      alt=""
      loading={priority ? undefined : "lazy"}
      decoding={priority ? undefined : "async"}
      fetchPriority={priority ? "high" : undefined}
      style={style}
    />
  );
}
