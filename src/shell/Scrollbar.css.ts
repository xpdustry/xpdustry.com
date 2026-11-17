import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "#app/ui/styles/theme.css";

/** Space between the thumb and either end of the screen. */
export const INSET = 3;
/** The thumb's shortest length, so a long page's thumb stays easy to grab. */
export const SHORTEST = 40;
/** How close to the edge of the screen a mouse shows the thumb, in px. */
export const REACH = 48;
/** How long the thumb stays after the page stops scrolling, in ms. */
export const IDLE = 900;

/** A light thumb, as the page's right edge is always the deep green backdrop, crown or footer. */
const light = (alpha: number) => `color-mix(in srgb, ${vars.onDeep} ${alpha}%, transparent)`;

/** Where the browser's own scrollbar stays, as under a finger, it matches ours. */
globalStyle(":root", {
  scrollbarColor: `${light(55)} transparent`
});

globalStyle(":root[data-scrollbar]", {
  scrollbarWidth: "none"
});

/** Hidden until the script takes over the page's scrollbar, and while the page does not scroll. */
export const track = style({
  display: "none",
  position: "fixed",
  insetBlock: 0,
  right: 0,
  zIndex: 90,
  width: 14,
  opacity: 0,
  touchAction: "none",
  transition: "opacity 300ms, background-color 150ms",
  selectors: {
    ":root[data-scrollbar] &": { display: "block" },
    ":root[data-scrollbar] &[data-off]": { display: "none" },
    "&:hover, &[data-active], &[data-drag], &[data-near]": { opacity: 1 },
    "&:hover, &[data-drag]": { background: light(10), transitionDuration: "100ms" }
  },
  "@media": {
    print: { visibility: "hidden" }
  }
});

/** Ringed in the deepest green, so it still reads where it passes over a light tile. */
export const thumb = style({
  position: "absolute",
  top: INSET,
  right: INSET,
  width: 6,
  borderRadius: 99,
  background: light(55),
  boxShadow: `0 0 0 1px color-mix(in srgb, ${vars.deep} 50%, transparent)`,
  transition: "width 150ms",
  selectors: {
    [`${track}:hover &, ${track}[data-drag] &`]: { width: 8, background: light(80) }
  },
  "@media": {
    "(forced-colors: active)": { background: "CanvasText" }
  }
});
