import type { StyleRule } from "@vanilla-extract/css";
import { movingPopover, shownPopover, shutPopover } from "#app/ui/popoverMotion";
import { radius } from "#app/ui/styles/scale";
import { pageGutter } from "#app/ui/styles/global.css";
import { vars } from "#app/ui/styles/theme.css";

type Selectors = NonNullable<StyleRule["selectors"]>;

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

export const popoverShut: StyleRule = {
  ...shutPopover,
  translate: "0 -8px",
  scale: "0.97",
  transformOrigin: "top right"
};

const popoverShown: StyleRule = {
  ...shownPopover,
  translate: "0",
  scale: "1"
};

export const popoverMoving = movingPopover(["opacity", "translate", "scale"], vars.easeOut);

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
  right: `calc(${pageGutter} + ${vars.gap} + 6px)`
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
