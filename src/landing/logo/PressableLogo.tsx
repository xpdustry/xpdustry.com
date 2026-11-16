import { useId } from "react";
import { COG_INK, COG_NORTH, COG_SIDES, COG_SOUTH, SQUASH, X, X_INK } from "./shapes";
import * as styles from "./PressableLogo.css";

const INK = "#30363b";
const COG_WALL = "#007f79";
const X_WALL = "#808080";

/** The height the X is cut at into the half behind the cog's sides and the half in front. */
const MIDDLE = 512;
/** A band right across the drawing, in its stretched units, from `top` down `height`. */
const band = (top: number, height: number) => (
  <rect x={-100 / SQUASH} y={top} width={1224 / SQUASH} height={height} />
);

/** A shape swept down to the floor in `color`: a wall, or for a grown shape, its outline. */
function Swept({ shape, color }: { shape: string; color: string }) {
  return <path d={shape} className={styles.swept} fill={color} stroke={color} />;
}

/**
 * The logo, which rises under the pointer and sinks under a press. It is an extrusion, drawn in
 * layers. First the outline: both shapes grown, and swept down to the floor. Then the walls, each
 * a shape swept down, from the back of the logo to the front, as a wall hangs over what lies
 * behind it and under what lies before: the cog's top piece, the X's upper half, the cog's sides,
 * the X's lower half, the cog's bottom piece. Then the faces, which nothing covers. A press moves
 * the faces and resizes the sweeps, with a transition: no script, no image.
 */
export function PressableLogo({ className }: { className?: string }) {
  const id = useId();
  const upper = `${id}upper`;
  const lower = `${id}lower`;

  return (
    // An empty touch listener lets Safari on iOS apply :active to a tap.
    <span className={`${styles.mark} ${className ?? ""}`} aria-hidden="true" onTouchStart={noop}>
      <svg className={styles.logo} viewBox="-24 -24 1072 1072">
        <g transform={`scale(${SQUASH} 1)`}>
          <defs>
            {/* The halves share a unit of the wall, so no seam shows between them. */}
            <clipPath id={upper}>{band(-100, MIDDLE + 101)}</clipPath>
            <clipPath id={lower}>{band(MIDDLE, 700)}</clipPath>
          </defs>
          <Swept shape={COG_INK} color={INK} />
          <Swept shape={X_INK} color={INK} />
          <Swept shape={COG_NORTH} color={COG_WALL} />
          <g clipPath={`url(#${upper})`}>
            <Swept shape={X} color={X_WALL} />
          </g>
          <Swept shape={COG_SIDES} color={COG_WALL} />
          <g clipPath={`url(#${lower})`}>
            <Swept shape={X} color={X_WALL} />
          </g>
          <Swept shape={COG_SOUTH} color={COG_WALL} />
          <path d={COG_NORTH + COG_SIDES + COG_SOUTH} className={styles.top} fill="#00fff1" />
          <path d={X} className={styles.top} fill="#ffffff" />
        </g>
      </svg>
    </span>
  );
}

function noop() {}
