import { useId, type MouseEventHandler } from "react";
import { SITE } from "#app/brand/site";
import { COG_INK, COG_NORTH, COG_SIDES, COG_SOUTH, SQUASH, X, X_INK } from "./shapes";
import * as styles from "./PressableLogo.css";

const INK = "#30363b";
const COG_WALL = "#007f79";
const X_WALL = "#808080";
const COG_FACE = "#00fff1";
const X_FACE = "#ffffff";

const X_CUT = 512;
const SEAM_OVERLAP = 1;

const stretchedBand = (top: number, height: number) => (
  <rect x={-100 / SQUASH} y={top} width={1224 / SQUASH} height={height} />
);

function Swept({ shape, color }: { shape: string; color: string }) {
  return <path d={shape} className={styles.swept} fill={color} stroke={color} />;
}

export function PressableLogo({
  className,
  onClick
}: {
  className?: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
}) {
  const id = useId();
  const xBehindSides = `${id}upper`;
  const xBeforeSides = `${id}lower`;

  return (
    // An empty touch listener lets Safari on iOS apply :active to a tap.
    <button
      type="button"
      className={`${styles.mark} ${className ?? ""}`}
      aria-label={SITE.name}
      onClick={onClick}
      onTouchStart={noop}
    >
      <svg className={styles.logo} viewBox="-24 -24 1072 1072">
        <g transform={`scale(${SQUASH} 1)`}>
          <defs>
            <clipPath id={xBehindSides}>{stretchedBand(-100, X_CUT + 100 + SEAM_OVERLAP)}</clipPath>
            <clipPath id={xBeforeSides}>{stretchedBand(X_CUT, 700)}</clipPath>
          </defs>
          <Outline />
          <WallsBackToFront xBehindSides={xBehindSides} xBeforeSides={xBeforeSides} />
          <Faces />
        </g>
      </svg>
    </button>
  );
}

function Outline() {
  return (
    <>
      <Swept shape={COG_INK} color={INK} />
      <Swept shape={X_INK} color={INK} />
    </>
  );
}

function WallsBackToFront({
  xBehindSides,
  xBeforeSides
}: {
  xBehindSides: string;
  xBeforeSides: string;
}) {
  return (
    <>
      <Swept shape={COG_NORTH} color={COG_WALL} />
      <g clipPath={`url(#${xBehindSides})`}>
        <Swept shape={X} color={X_WALL} />
      </g>
      <Swept shape={COG_SIDES} color={COG_WALL} />
      <g clipPath={`url(#${xBeforeSides})`}>
        <Swept shape={X} color={X_WALL} />
      </g>
      <Swept shape={COG_SOUTH} color={COG_WALL} />
    </>
  );
}

function Faces() {
  return (
    <>
      <path d={COG_NORTH + COG_SIDES + COG_SOUTH} className={styles.top} fill={COG_FACE} />
      <path d={X} className={styles.top} fill={X_FACE} />
    </>
  );
}

function noop() {}
