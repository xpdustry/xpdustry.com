import { keyframes, style } from "@vanilla-extract/css";
import { BACKDROP, CROWN } from "#app/data/textures";
import { media } from "#app/styles/media";

// `pnpm textures` renders the tiles from `BACKDROP`, and the crown from `CROWN`

/** A backdrop tile's size, in px: each layer drifts by one, over and over. */
export const TILE = BACKDROP.far.repeat;
/** Scroll per tile of drift, in tiles: the far layer moves at a sixth of the page's speed, the near at a third. */
export const FAR = 6;
export const NEAR = 3;
/** How many tiles a scroll-driven layer drifts before it stops, past any page's length. */
const LOOPS = 40;

const drift = keyframes({
  to: { transform: `translateY(-${TILE}px)` },
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
      background: `0 0 / ${TILE}px`,
    },
    "&::before": {
      backgroundImage: 'url("../../assets/backdrop-far.webp")',
    },
    "&::after": {
      backgroundImage: 'url("../../assets/backdrop-near.webp")',
    },
    // without scroll-driven animations, `Background` sets the drift from a scroll listener, in
    // `--far` and `--near`
    "&[data-drift]::before, &[data-drift]::after": {
      bottom: -TILE,
      willChange: "transform",
    },
    "&[data-drift]::before": {
      transform: "translateY(var(--far, 0))",
    },
    "&[data-drift]::after": {
      transform: "translateY(var(--near, 0))",
    },
  },
  // the parallax, on the compositor
  "@media": {
    [media.motion]: {
      "@supports": {
        "(animation-timeline: scroll())": {
          selectors: {
            "&::before, &::after": {
              bottom: -TILE,
              animation: `${drift} linear ${LOOPS} both`,
              animationDuration: "auto",
              animationTimeline: "scroll(root)",
            },
            "&::before": {
              animationRange: `0 ${TILE * FAR * LOOPS}px`,
            },
            "&::after": {
              animationRange: `0 ${TILE * NEAR * LOOPS}px`,
            },
          },
        },
      },
    },
  },
});

/** Scrolls with the page, unlike the backdrop under it. */
export const crown = style({
  position: "absolute",
  inset: "0 0 auto",
  zIndex: -1,
  height: CROWN.height,
  background: `url("../../assets/crown.webp") 50% 0 / ${CROWN.width}px ${CROWN.height}px repeat-x`,
  pointerEvents: "none",
});
