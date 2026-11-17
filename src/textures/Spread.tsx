import { assignInlineVars } from "@vanilla-extract/dynamic";
import { useState } from "react";
import type { Px, SpreadPalette } from "./texture";
import * as styles from "./Spread.css";

export type SpreadOrigin = readonly [x: Px, y: Px];

export interface SpreadStart {
  origin: SpreadOrigin;
  reach: Px;
}

const MOUNTED_PLAYS = 4;

interface Play {
  id: number;
  from?: SpreadStart;
  on: boolean;
}

export function Spread({
  palette,
  on,
  from,
  wave
}: {
  palette?: SpreadPalette;
  on: boolean;
  from?: SpreadStart;
  wave?: boolean;
}) {
  const [plays, setPlays] = useState<readonly Play[]>([{ id: 0, from, on }]);
  const newest = plays.at(-1)!;
  if (from !== newest.from) {
    setPlays([...plays.slice(1 - MOUNTED_PLAYS), { id: newest.id + 1, from, on }]);
  } else if (on !== newest.on) {
    setPlays([...plays.slice(0, -1), { ...newest, on }]);
  }

  return plays.map((play) => {
    const covered = play !== newest;
    return (
      <span
        key={play.id}
        className={`${styles.spread} ${palette ? styles.ready : ""} ${play.on ? styles.on : ""} ${wave ? styles.wave : covered ? styles.covered : ""}`}
        style={place(palette, play.from)}
        aria-hidden="true"
        data-spread={covered ? "covered" : "current"}
      >
        <i />
      </span>
    );
  });
}

const place = (palette: SpreadPalette | undefined, from: SpreadStart | undefined) =>
  assignInlineVars({
    [styles.color]: palette?.color,
    [styles.inner]: palette?.inner,
    ...(from && {
      [styles.originX]: `${from.origin[0]}px`,
      [styles.originY]: `${from.origin[1]}px`,
      [styles.reach]: `${from.reach}px`
    })
  });

export function spreadFrom(origin: SpreadOrigin, width: Px, height: Px): SpreadStart {
  const [x, y] = origin;
  return { origin, reach: Math.hypot(Math.max(x, width - x), Math.max(y, height - y)) };
}

const centre = (box: DOMRectReadOnly) =>
  [box.left + box.width / 2, box.top + box.height / 2] as const;

export function spreadFromPress(
  press: { detail: number; clientX: number; clientY: number },
  box: DOMRectReadOnly,
  keyPressOrigin: DOMRectReadOnly
): SpreadStart {
  const pressedByKey = press.detail === 0;
  const [x, y] = pressedByKey ? centre(keyPressOrigin) : [press.clientX, press.clientY];
  return spreadFrom([x - box.left, y - box.top], box.width, box.height);
}
