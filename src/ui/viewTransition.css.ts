import { globalStyle, keyframes, style } from "@vanilla-extract/css";
import { media } from "./styles/media";
import { vars } from "./styles/theme.css";

export const TRANSITION = { deeper: "deeper", shallower: "shallower", post: "post" } as const;
export type TransitionType = (typeof TRANSITION)[keyof typeof TRANSITION];

export const LEAVING = "data-leaving";
export const IN_VIEW = "data-in-view";

const PAGE_MS = 260;
const SLIDE = "32px";
const SAME_DOCUMENT = `:root:active-view-transition-type(${TRANSITION.deeper}, ${TRANSITION.shallower})`;

globalStyle("::view-transition-group(*)", {
  zIndex: 1,
  animationDuration: `${PAGE_MS}ms`,
  animationTimingFunction: vars.easeOut
});

globalStyle("::view-transition-group(root), ::view-transition-group(page)", {
  zIndex: 0
});

globalStyle("::view-transition-old(root), ::view-transition-new(root)", {
  animationDuration: `${PAGE_MS}ms`,
  animationTimingFunction: vars.easeOut
});

globalStyle(`${SAME_DOCUMENT} main:not([${LEAVING}])`, {
  viewTransitionName: "page"
});

for (const [type, from] of [
  [TRANSITION.deeper, SLIDE],
  [TRANSITION.shallower, `-${SLIDE}`]
] as const) {
  globalStyle(`:root:active-view-transition-type(${type})::view-transition-new(page)`, {
    animationName: keyframes({ from: { opacity: 0, translate: `${from} 0` } }),
    animationDuration: `${PAGE_MS}ms`,
    animationTimingFunction: vars.easeOut
  });
}

export const traveller = style({});

export const play = style([traveller]);

globalStyle(`${SAME_DOCUMENT} ${play}[${IN_VIEW}]`, {
  viewTransitionName: "play"
});

globalStyle("::view-transition-old(play), ::view-transition-new(play)", {
  height: "100%"
});

const grown = { opacity: 0, scale: "0.6" };

globalStyle("::view-transition-new(play):only-child", {
  animationName: keyframes({ from: grown })
});

globalStyle("::view-transition-old(play):only-child", {
  animationName: keyframes({ to: grown })
});

globalStyle(
  "::view-transition-group(*), ::view-transition-image-pair(*), ::view-transition-old(*), ::view-transition-new(*)",
  {
    "@media": {
      [media.still]: { animation: "none !important" }
    }
  }
);
