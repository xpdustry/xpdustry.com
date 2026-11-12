import type { CSSProperties } from "react";
import type { SpreadStage, SpreadTiles } from "#app/data/textures";
import styles from "./Spread.module.css";

const TILES = import.meta.glob<string>("/src/assets/spread/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});

const tile = (tiles: SpreadTiles, stage: SpreadStage) =>
  `url("${TILES[`/src/assets/spread/${tiles[stage].name}.webp`]}")`;

/** Where a spread starts, in px from its parent's top left corner. */
export type SpreadOrigin = readonly [x: number, y: number];

/**
 * A palette's reticulate spreading over its positioned parent, behind the content, while `on`:
 * out from `origin` as thin threads that thicken and fuse solid behind them, until it has closed
 * over the farthest corner. It fades away once `on` is over.
 */
export function Spread({
  tiles,
  on,
  origin,
  reach,
}: {
  tiles: SpreadTiles;
  on: boolean;
  origin?: SpreadOrigin;
  /** How far the farthest corner is from `origin`, in px. */
  reach?: number;
}) {
  const style = {
    "--thin": tile(tiles, "thin"),
    "--thick": tile(tiles, "thick"),
    "--solid": tile(tiles, "solid"),
    ...(origin && { "--x": `${origin[0]}px`, "--y": `${origin[1]}px` }),
    ...(reach !== undefined && { "--reach": `${reach}px` }),
  } as CSSProperties;
  return (
    <span className={`${styles.spread} ${on ? styles.on : ""}`} style={style} aria-hidden="true">
      <i />
    </span>
  );
}

/** A spread's `origin` and `reach` for a click at `origin` in an element of this size. */
export function spreadFrom(origin: SpreadOrigin, width: number, height: number) {
  const [x, y] = origin;
  return { origin, reach: Math.hypot(Math.max(x, width - x), Math.max(y, height - y)) };
}
