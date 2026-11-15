import { texture } from "./enter";
import { blobSprite, type Patches as PatchesData } from "./texture";
import * as styles from "./Patches.css";

/**
 * A card's patches of labyrinth, each blob a sprite the painter paints in the visitor's browser.
 * By default they fill their positioned parent, behind the content. Growing patches lay each
 * blob's grown sprite over it, uncovered from the middle out while the card is hovered.
 *
 * On the first screen, the blobs grow in as the page loads. Patches that shape their parent
 * instead of decorating it, such as a frayed edge, pass `still` and paint with it.
 */
export function Patches({
  patches,
  className,
  still = false
}: {
  patches: PatchesData;
  className?: string;
  still?: boolean;
}) {
  const mark = (grown: boolean) => (still ? {} : texture(grown ? "grown" : "grow", patches.tile));
  return (
    <span className={`${styles.patches} ${className ?? ""}`} aria-hidden="true">
      {patches.blobs.map(([x, y, radius, turn = 0], at) => {
        const sprite = blobSprite(patches, radius);
        return (
          <span
            key={at}
            className={styles.placement}
            style={{
              left: `${x * 100}%`,
              top: `${y * 100}%`,
              width: sprite.size,
              height: sprite.size,
              transform: turn
                ? `rotate(${(turn % 4) * 90}deg) scaleX(${turn < 4 ? 1 : -1})`
                : undefined
            }}
          >
            <span className={styles.sprite} data-paint={sprite.key} {...mark(false)} />
            {patches.grow && (
              <span
                className={`${styles.sprite} ${styles.grown}`}
                data-paint={blobSprite(patches, radius, true).key}
                {...mark(true)}
              />
            )}
          </span>
        );
      })}
    </span>
  );
}
