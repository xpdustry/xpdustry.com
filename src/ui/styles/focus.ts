import type { StyleRule } from "@vanilla-extract/css";
import { vars } from "./theme.css";

const RING = 3;
const GAP = 3;
const FORCED_COLOURS = "(forced-colors: active)";

const inForcedColours = {
  "@media": { [FORCED_COLOURS]: { outlineColor: "Highlight" } }
} satisfies StyleRule;

export const ringOutside: StyleRule = {
  outline: `${RING}px solid ${vars.focus}`,
  outlineOffset: GAP,
  boxShadow: `0 0 0 ${GAP}px ${vars.focusGap}`,
  ...inForcedColours
};

export const ringInside = (border: number): StyleRule => ({
  outline: `${RING}px solid ${vars.focus}`,
  outlineOffset: -(border + GAP + RING),
  boxShadow: `inset 0 0 0 ${border + GAP}px ${vars.focusGap}`,
  ...inForcedColours
});
