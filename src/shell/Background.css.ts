import { keyframes, style } from "@vanilla-extract/css";
import { BACKDROP, CROWN } from "#app/textures/page";
import { media } from "#app/ui/styles/media";

export const TILE = BACKDROP.far.repeat;
export const FAR = 6;
export const NEAR = 3;
const LOOPS = 40;

const drift = keyframes({
  to: { transform: `translateY(-${TILE}px)` }
});

export const background = style({
  position: "fixed",
  inset: 0,
  zIndex: -1,
  pointerEvents: "none",
  selectors: {
    "&::before, &::after": {
      content: '""',
      position: "absolute",
      inset: 0,
      background: `0 0 / ${TILE}px`
    },
    "&::before": {
      backgroundImage: 'url("../textures/assets/backdrop-far.webp")'
    },
    "&::after": {
      backgroundImage: 'url("../textures/assets/backdrop-near.webp")'
    },
    "&[data-drift]::before, &[data-drift]::after": {
      bottom: -TILE,
      willChange: "transform"
    },
    "&[data-drift]::before": {
      transform: "translateY(var(--far, 0))"
    },
    "&[data-drift]::after": {
      transform: "translateY(var(--near, 0))"
    }
  },
  "@media": {
    [media.motion]: {
      "@supports": {
        "(animation-timeline: scroll())": {
          selectors: {
            "&::before, &::after": {
              bottom: -TILE,
              animation: `${drift} linear ${LOOPS} both`,
              animationDuration: "auto",
              animationTimeline: "scroll(root)"
            },
            "&::before": {
              animationRange: `0 ${TILE * FAR * LOOPS}px`
            },
            "&::after": {
              animationRange: `0 ${TILE * NEAR * LOOPS}px`
            }
          }
        }
      }
    }
  }
});

export const crown = style({
  position: "absolute",
  inset: "0 0 auto",
  zIndex: -1,
  height: CROWN.height,
  background: `url("../textures/assets/crown.webp") 50% 0 / ${CROWN.width}px ${CROWN.height}px repeat-x`,
  pointerEvents: "none"
});
