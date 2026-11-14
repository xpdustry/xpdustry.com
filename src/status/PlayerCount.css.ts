import { keyframes, style } from "@vanilla-extract/css";
import { media } from "#app/ui/styles/media";

export const status = style({
  display: "inline-flex",
  alignItems: "center",
  flexShrink: 0
});

const spin = keyframes({
  to: { transform: "rotate(360deg)" }
});

export const spinner = style({
  "@media": {
    [media.motion]: { animation: `${spin} 1s linear infinite` }
  }
});
