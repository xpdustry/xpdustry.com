import type { StyleRule } from "@vanilla-extract/css";
import type { ToggleEvent, TransitionEvent } from "react";

type Selectors = NonNullable<StyleRule["selectors"]>;

const DURATION = "0.18s";
const MOVING = "data-moving";

// Hidden rather than the browser's `display: none`: without `overlay`, which Firefox and Safari lack
// (https://bugzil.la/1841456), a popover cannot animate on its way out of the top layer.
export const shutPopover = { visibility: "hidden", opacity: 0 } as const;
export const shownPopover = { visibility: "visible", opacity: 1 } as const;

const visibleAtOnce = { transitionDelay: "0s" };

export function movingPopover(
  properties: readonly string[],
  easing: string,
  whileMoving: StyleRule = {}
): Selectors {
  const transition = [
    ...properties.map((property) => `${property} ${DURATION} ${easing}`),
    `visibility 0s ${DURATION}`
  ].join(", ");
  return {
    [`&[${MOVING}]`]: { ...whileMoving, transition },
    [`&[${MOVING}]:popover-open`]: visibleAtOnce
  };
}

export function stopMoving(popover: HTMLElement) {
  popover.removeAttribute(MOVING);
}

const stopOnceItsOwnTransitionIsOver = (event: TransitionEvent<HTMLElement>) => {
  if (event.target === event.currentTarget) stopMoving(event.currentTarget);
};

export const animateOnToggle = {
  onBeforeToggle: (event: ToggleEvent<HTMLElement>) => event.currentTarget.setAttribute(MOVING, ""),
  onToggle: (event: ToggleEvent<HTMLElement>) => {
    const toggledWithoutMotion = event.currentTarget.getAnimations().length === 0;
    if (toggledWithoutMotion) stopMoving(event.currentTarget);
  },
  onTransitionEnd: stopOnceItsOwnTransitionIsOver,
  onTransitionCancel: stopOnceItsOwnTransitionIsOver
};
