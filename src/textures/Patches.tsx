import { assignInlineVars } from "@vanilla-extract/dynamic";
import { texture } from "./enter";
import { blobSprite, type Patches as PatchesData } from "./texture";
import * as styles from "./Patches.css";

const SPRITES = import.meta.glob<string>("/src/textures/assets/patches/*.webp", {
  eager: true,
  query: "?url",
  import: "default"
});

/** Palette-free masks, reused across cards. Each file holds an outline and its inner tone. */
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
  return (
    <span
      className={`${styles.patches} ${className ?? ""}`}
      style={assignInlineVars({ [styles.color]: patches.color, [styles.inner]: patches.inner })}
      aria-hidden="true"
    >
      {patches.blobs.map((blob, at) => (
        <Patch key={at} patches={patches} blob={blob} priority={priority} still={still} />
      ))}
    </span>
  );
}

function Patch({
  patches,
  blob,
  priority,
  still
}: {
  patches: PatchesData;
  blob: PatchesData["blobs"][number];
  priority: boolean;
  still: boolean;
}) {
  const [x, y, radius, originalTurn = 0] = blob;
  const turn = (originalTurn + Math.floor((patches.shape ?? 0) / 2)) % 8;
  const sprite = blobSprite(patches, radius);
  return (
    <span
      className={styles.placement}
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: sprite.displaySize,
        height: sprite.displaySize,
        transform: `rotate(${(turn % 4) * 90}deg) scaleX(${turn < 4 ? 1 : -1})`
      }}
    >
      <Sprite sprite={sprite} priority={priority} still={still} />
      {patches.grow && (
        <Sprite sprite={blobSprite(patches, radius, true)} stage="grown" still={still} />
      )}
    </span>
  );
}

const STAGES = {
  base: { className: styles.sprite, kind: "grow" },
  grown: { className: `${styles.sprite} ${styles.grown}`, kind: "grown" }
} as const;

function Sprite({
  sprite,
  priority = false,
  still,
  stage = "base"
}: {
  sprite: ReturnType<typeof blobSprite>;
  priority?: boolean;
  still: boolean;
  stage?: keyof typeof STAGES;
}) {
  const image = SPRITES[`/src/textures/assets/patches/${sprite.name}.webp`];
  const appearance = STAGES[stage];
  const marker = still ? {} : texture(appearance.kind, sprite.tile);
  return (
    <>
      {priority && <link rel="preload" as="image" href={image} fetchPriority="high" />}
      <span className={appearance.className} data-image={image} {...marker}>
        <Paint sprite={sprite} image={image} priority={priority} />
      </span>
    </>
  );
}

function Paint({
  sprite,
  image,
  priority
}: {
  sprite: ReturnType<typeof blobSprite>;
  image: string;
  priority: boolean;
}) {
  if (sprite.kind === "raster")
    return (
      <img
        className={styles.raster}
        src={image}
        alt=""
        width={sprite.size}
        height={sprite.size}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    );
  return (
    <span
      className={styles.paint}
      style={assignInlineVars({ [styles.image]: `url("${image}")` })}
    />
  );
}
