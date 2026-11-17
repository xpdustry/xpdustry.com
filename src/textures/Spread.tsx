import { assignInlineVars } from "@vanilla-extract/dynamic";
import { useState } from "react";
import type { SpreadPalette } from "./texture";
import * as styles from "./Spread.css";

/** Where a spread starts, in px from its parent's top left corner. */
export type SpreadOrigin = readonly [x: number, y: number];

/** Where a spread starts, and how far the farthest corner is from there, in px. */
export interface SpreadStart {
  origin: SpreadOrigin;
  reach: number;
}

/**
 * A palette's reticulate spreading over its positioned parent, behind the content, while `on`:
 * out from `from` as thin threads that thicken and fuse solid behind them, until it has closed
 * over the farthest corner. It fades away once `on` is over. A new `from` plays it again from
 * there, over the last play, which carries on as it was as it fades away beneath.
 *
 * Its palette can wait until the card is near the viewport. Every palette shows through the same
 * three masks the painter paints once, so another card's spread costs nothing more.
 */
export function Spread({
  palette,
  on,
  from
}: {
  palette?: SpreadPalette;
  on: boolean;
  from?: SpreadStart;
}) {
  // Each press is a new `from`, and a fresh element, so its animation starts over from nothing.
  const [plays, setPlays] = useState<readonly Play[]>([{ id: 0, from }]);
  const last = plays.at(-1)!;
  if (from !== last.from)
    setPlays([
      { ...last, on },
      { id: last.id + 1, from }
    ]);

  return plays.map((play) => {
    const current = play === last;
    const growing = current ? on : play.on;
    return (
      <span
        key={play.id}
        className={`${styles.spread} ${palette ? styles.ready : ""} ${growing ? styles.on : ""} ${current ? "" : styles.gone}`}
        style={place(palette, play.from)}
        aria-hidden="true"
        data-spread={current ? "current" : "covered"}
      >
        <i />
      </span>
    );
  });
}

/**
 * A press's spread, and, once a newer one is over it, whether it was still on then: one that had
 * started fading away keeps fading as it was, rather than growing again.
 */
interface Play {
  id: number;
  from?: SpreadStart;
  on?: boolean;
}

const place = (palette: SpreadPalette | undefined, from: SpreadStart | undefined) =>
  assignInlineVars({
    [styles.color]: palette?.color,
    [styles.inner]: palette?.inner,
    ...(from && {
      [styles.x]: `${from.origin[0]}px`,
      [styles.y]: `${from.origin[1]}px`,
      [styles.reach]: `${from.reach}px`
    })
  });

/** The spread for a press at `origin` in an element of this size, out to its farthest corner. */
export function spreadFrom(origin: SpreadOrigin, width: number, height: number): SpreadStart {
  const [x, y] = origin;
  return { origin, reach: Math.hypot(Math.max(x, width - x), Math.max(y, height - y)) };
}

/**
 * The spread for a press in `box`, both in viewport px: from the pointer, or from the middle of
 * `fallback` for a key press, which has no pointer and reports a `detail` of 0.
 */
export function spreadFromPress(
  press: { detail: number; clientX: number; clientY: number },
  box: DOMRectReadOnly,
  fallback: DOMRectReadOnly
): SpreadStart {
  const [x, y] = press.detail
    ? [press.clientX, press.clientY]
    : [fallback.left + fallback.width / 2, fallback.top + fallback.height / 2];
  return spreadFrom([x - box.left, y - box.top], box.width, box.height);
}
