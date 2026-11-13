import type { CSSProperties } from "react";
import { texture } from "./enter";
import { blobSprite, type Patches as PatchesData } from "./texture";
import * as styles from "./Patches.css";

const SPRITES = import.meta.glob<string>("/src/textures/assets/patches/*.webp", {
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
 *
 * On the first screen, the blobs grow in as the page loads. Patches that shape their parent
 * instead of decorating it, such as a frayed edge, pass `still` and paint with it.
 */
export function Patches({
  patches,
  className,
  priority = false,
  still = false
}: {
  patches: PatchesData;
  className?: string;
  priority?: boolean;
  still?: boolean;
}) {
  const mark = (grown: boolean) => (still ? {} : texture(grown ? "grown" : "grow", patches.tile));
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
            <Sprite
              sprite={blobSprite(patches, radius)}
              style={style}
              priority={priority}
              {...mark(false)}
            />
            {patches.grow && (
              <Sprite
                sprite={blobSprite(patches, radius, true)}
                style={style}
                grown
                {...mark(true)}
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
  priority = false,
  grown = false,
  ...marker
}: {
  sprite: ReturnType<typeof blobSprite>;
  style: CSSProperties;
  priority?: boolean;
  grown?: boolean;
} & Partial<ReturnType<typeof texture>>) {
  const fetching = priority
    ? { fetchPriority: "high" as const }
    : { loading: "lazy" as const, decoding: "async" as const };
  return (
    <img
      className={grown ? styles.grown : undefined}
      src={SPRITES[`/src/textures/assets/patches/${sprite.name}.webp`]}
      width={sprite.size}
      height={sprite.size}
      alt=""
      {...fetching}
      style={style}
      {...marker}
    />
  );
}
