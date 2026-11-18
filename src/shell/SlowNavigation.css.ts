import { globalStyle, keyframes, style } from "@vanilla-extract/css";
import { media } from "#app/ui/styles/media";
import { vars } from "#app/ui/styles/theme.css";

const sweep = keyframes({
  from: { translate: "-100% 0" },
  to: { translate: "100vw 0" }
});

export const bar = style({
  position: "fixed",
  insetInline: 0,
  top: 0,
  zIndex: 100,
  height: 3,
  overflow: "hidden",
  background: vars.t9,
  pointerEvents: "none",
  "@media": {
    [media.motion]: {
      animation: `${keyframes({ from: { opacity: 0 } })} 150ms ${vars.easeOut}`
    }
  }
});

globalStyle(`${bar}::after`, {
  content: '""',
  position: "absolute",
  insetBlock: 0,
  left: 0,
  width: "35%",
  background: `linear-gradient(90deg, transparent, ${vars.t3}, transparent)`,
  "@media": {
    [media.motion]: { animation: `${sweep} 1.2s ${vars.easeOut} infinite` }
  }
});
