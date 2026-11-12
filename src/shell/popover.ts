import type { StyleRule } from "@vanilla-extract/css";
import { vars } from "#app/ui/styles/theme.css";

const DURATION = "0.18s";

/**
 * The browser's own box for a `popover`, undone. A shut popover stays laid out, hidden, rather than
 * taking the browser's `display: none`: Firefox and Safari cannot animate out of that. One hung
 * from the right of a button that enlarged text wrapped to the left of the screen turns to hang from
 * its left.
 */
export const popoverBox: StyleRule = {
  positionTryFallbacks: "flip-inline",
  inset: "auto",
  width: "auto",
  height: "auto",
  margin: 0,
  overflow: "visible",
  color: "inherit"
};

/** A panel that drops from under its button: out of sight, focus and the accessibility tree. */
export const popoverShut: StyleRule = {
  visibility: "hidden",
  opacity: 0,
  translate: "0 -8px",
  scale: "0.97",
  transformOrigin: "top right"
};

/** Set from the moment a popover is asked to open or shut until its animation ends. */
export const MOVING = "data-moving";

/** For visitors who accept motion. Visibility waits for the fade when shutting. */
const popoverTransition = `opacity ${DURATION} ${vars.easeOut}, translate ${DURATION} ${vars.easeOut}, scale ${DURATION} ${vars.easeOut}, visibility 0s ${DURATION}`;

export const popoverOpen: StyleRule = {
  visibility: "visible",
  opacity: 1,
  translate: "0",
  scale: "1"
};

/**
 * The transition, only while the popover moves, so that a resize does not animate it. An opening
 * popover is visible at once, so that the first Tab reaches its links.
 */
export const popoverMoving = {
  [`&[${MOVING}]`]: { transition: popoverTransition },
  [`&[${MOVING}]:popover-open`]: { transitionDelay: "0s" }
};

/**
 * Where an open popover sits in a browser without anchor positioning, which lifts it to the top
 * layer and so measures it from the top left of the page: under the header's right end. It follows
 * the page's `.wrap` and the header's own padding.
 */
export const popoverFallbackPlace = {
  top: `calc(${vars.gap} + 60px)`,
  right: `calc(clamp(20px, 5vw, 56px) + ${vars.gap} + 6px)`
};
