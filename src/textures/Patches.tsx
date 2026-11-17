import { texture } from "./enter";
import { blobSprite, type Patches as PatchesData, type Turn } from "./texture";
import * as styles from "./Patches.css";

const transform = ({ quarters, mirrored }: Turn) =>
  quarters || mirrored ? `rotate(${quarters * 90}deg) scaleX(${mirrored ? -1 : 1})` : undefined;

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
      {patches.blobs.map(([x, y, radius, turn], at) => {
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
              transform: turn && transform(turn)
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
