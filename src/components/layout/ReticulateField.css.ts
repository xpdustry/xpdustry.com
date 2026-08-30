import { style } from "@vanilla-extract/css";
import reticulate from "#app/assets/reticulate.png";
import { colors, palette } from "#app/styles/theme.css";

export const field = style({
  pointerEvents: "none",
  position: "absolute",
  insetInline: 0,
  top: 0,
  zIndex: -1,
  height: "100%",
  overflow: "hidden",
  opacity: 0.2,
  selectors: {
    '[data-theme="light"] &': {
      opacity: 0.2,
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

export const net = style({
  position: "absolute",
  inset: 0,
  backgroundImage: `linear-gradient(100deg, ${colors.codeString}, ${palette.accent})`,
  maskImage: `url("${reticulate}")`,
  maskSize: "clamp(27.5rem, 48vw, 47.5rem)",
  maskRepeat: "repeat",
});
