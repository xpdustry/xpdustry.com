import { globalStyle } from "@vanilla-extract/css";
import { media } from "./media";

const TOUCH_TARGET = 44;

const growToTouchTarget = `min(0px, (100% - ${TOUCH_TARGET}px) / 2)`;

export function reachTouchTarget(positionedControl: string, drawnAboveItsBoxBy = 0) {
  const inset =
    drawnAboveItsBoxBy === 0
      ? growToTouchTarget
      : `calc(${growToTouchTarget} - ${drawnAboveItsBoxBy}px) ${growToTouchTarget} calc(${growToTouchTarget} + ${drawnAboveItsBoxBy}px)`;
  globalStyle(`${positionedControl}::after`, {
    "@media": {
      [media.coarse]: { content: '""', position: "absolute", inset }
    }
  });
}

export const touchTargetHeight = {
  "@media": {
    [media.coarse]: { display: "inline-flex", alignItems: "center", minHeight: TOUCH_TARGET }
  }
};
