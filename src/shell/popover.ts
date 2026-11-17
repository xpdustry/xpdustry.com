import type { StyleRule } from "@vanilla-extract/css";
import { radius } from "#app/ui/styles/scale";
import { vars } from "#app/ui/styles/theme.css";

type Selectors = NonNullable<StyleRule["selectors"]>;

const DURATION = "0.18s";
const GAP_UNDER_BUTTON = "10px";

export const popoverBox: StyleRule = {
  positionTryFallbacks: "flip-inline",
  inset: "auto",
  width: "auto",
  height: "auto",
  margin: 0,
  overflow: "visible",
  color: "inherit"
};

// Hidden rather than the browser's `display: none`: without `overlay`, which Firefox and Safari lack
// (https://bugzil.la/1841456), a popover cannot animate on its way out of the top layer.
export const popoverShut: StyleRule = {
  visibility: "hidden",
  opacity: 0,
  translate: "0 -8px",
  scale: "0.97",
  transformOrigin: "top right"
};

const popoverShown: StyleRule = {
  visibility: "visible",
  opacity: 1,
  translate: "0",
  scale: "1"
};

export const MOVING = "data-moving";

const popoverTransition = `opacity ${DURATION} ${vars.easeOut}, translate ${DURATION} ${vars.easeOut}, scale ${DURATION} ${vars.easeOut}, visibility 0s ${DURATION}`;
const visibleAtOnce = { transitionDelay: "0s" };

export const popoverMoving: Selectors = {
  [`&[${MOVING}]`]: { transition: popoverTransition },
  [`&[${MOVING}]:popover-open`]: visibleAtOnce
};

export const popoverPanel: StyleRule = {
  border: `2px solid ${vars.deepWall}`,
  borderRadius: radius.lg,
  background: vars.deep,
  boxShadow: "0 18px 40px -12px rgb(0 0 0 / 0.55)"
};

interface Place {
  top: string | number;
  right: string | number;
}

const HEADER_END_IN_TOP_LAYER: Place = {
  top: `calc(${vars.gap} + 60px)`,
  right: `calc(clamp(20px, 5vw, 56px) + ${vars.gap} + 6px)`
};

export const underParent = (right: Place["right"], lift = "0px"): Place => ({
  top: `calc(100% - ${lift} + ${GAP_UNDER_BUTTON})`,
  right
});

export function hangUnder(anchor: string, withoutAnchorPositioning: Place) {
  const anchored: Place = {
    top: `calc(anchor(${anchor} bottom) + ${GAP_UNDER_BUTTON})`,
    right: `anchor(${anchor} right)`
  };
  const anchoredOr = (fallback: Place) => ({
    top: [fallback.top, anchored.top],
    right: [fallback.right, anchored.right]
  });
  return {
    shut: anchoredOr(withoutAnchorPositioning) satisfies StyleRule,
    shown: {
      "&:popover-open": { ...popoverShown, ...anchoredOr(HEADER_END_IN_TOP_LAYER) }
    } satisfies Selectors
  };
}
