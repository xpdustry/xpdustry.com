import { style } from "@vanilla-extract/css";
import reticulate from "#app/assets/reticulate.png";
import { colors, layout, palette } from "#app/styles/theme.css";

export const field = style({
  pointerEvents: "none",
  position: "absolute",
  insetInline: 0,
  top: 0,
  zIndex: -1,
  height: "100%",
  overflow: "hidden",
  opacity: 0.5,
  selectors: {
    '[data-theme="light"] &': {
      opacity: 0.5,
    },
    '[data-theme="dark"] &': {
      opacity: 0.1,
    },
  },
  "@media": {
    "(prefers-color-scheme: dark)": {
      opacity: 0.1,
    },
    "(prefers-contrast: more)": {
      display: "none",
    },
  },
});

// Distance from the viewport edge to the content column, matching layoutRules.wrap.
const columnEdge = `max(${layout.gutter}, 50% - ${layout.page} / 2)`;

// Hides the pattern behind the content column, fading in towards the viewport edges.
const columnFade = `linear-gradient(to right, black calc(${columnEdge} - 8rem), transparent calc(${columnEdge} + 4rem), transparent calc(100% - ${columnEdge} - 4rem), black calc(100% - ${columnEdge} + 8rem))`;

export const net = style({
  position: "absolute",
  inset: 0,
  backgroundImage: `linear-gradient(100deg, ${colors.codeString}, ${palette.accent})`,
  maskImage: `url("${reticulate}"), ${columnFade}`,
  maskSize: "clamp(27.5rem, 48vw, 47.5rem), 100% 100%",
  maskRepeat: "repeat, no-repeat",
  maskComposite: "intersect",
});
