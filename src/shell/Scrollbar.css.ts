import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "#app/ui/styles/theme.css";

export const THUMB = {
  insetPx: 3,
  minLengthPx: 40,
  mouseReachPx: 48,
  lingerMs: 900
};

const onDeepAt = (alpha: number) => `color-mix(in srgb, ${vars.onDeep} ${alpha}%, transparent)`;

globalStyle(":root", {
  scrollbarColor: `${onDeepAt(55)} transparent`
});

globalStyle(":root[data-scrollbar]", {
  scrollbarWidth: "none"
});

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
    "&:hover, &[data-drag]": { background: onDeepAt(10), transitionDuration: "100ms" }
  },
  "@media": {
    print: { visibility: "hidden" }
  }
});

export const thumb = style({
  position: "absolute",
  top: THUMB.insetPx,
  right: THUMB.insetPx,
  width: 6,
  borderRadius: 99,
  background: onDeepAt(55),
  boxShadow: `0 0 0 1px color-mix(in srgb, ${vars.deep} 50%, transparent)`,
  // oxlint-disable-next-line xpdustry/no-layout-transition -- the audited exception: a 6 to 8px thumb
  transition: "width 150ms",
  selectors: {
    [`${track}:hover &, ${track}[data-drag] &`]: { width: 8, background: onDeepAt(80) }
  },
  "@media": {
    "(forced-colors: active)": { background: "CanvasText" }
  }
});
