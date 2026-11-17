import { createVar, style } from "@vanilla-extract/css";
import { media } from "#app/ui/styles/media";

type LogoUnits = number;

const EXTRUSION: LogoUnits = 30.72;
const HOVER_LIFT: LogoUnits = 19.2;

const inLogoUnits = (value: LogoUnits) => `${value}px`;

const faceDrop = createVar({ syntax: "<length>", inherits: true, initialValue: "0px" });
const faceDropProperty = faceDrop.slice("var(".length, -1);

export const mark = style({
  flex: "none",
  margin: "-6px -4px -6px -8px",
  padding: 0,
  border: 0,
  background: "none",
  font: "inherit",
  cursor: "pointer",
  userSelect: "none",
  WebkitTouchCallout: "none",
  WebkitTapHighlightColor: "transparent"
});

export const logo = style({
  display: "block",
  width: "100%",
  height: "auto",
  aspectRatio: "1",
  overflow: "visible",
  pointerEvents: "none",
  vars: { [faceDrop]: "0px" },
  "@media": {
    [media.motion]: {
      transition: `${faceDropProperty} 190ms cubic-bezier(0.25, 1, 0.5, 1)`,
      selectors: {
        [`${mark}:active &`]: {
          vars: { [faceDrop]: inLogoUnits(EXTRUSION) },
          transitionDuration: "60ms"
        }
      }
    },
    [`${media.motion} and (hover: hover)`]: {
      selectors: {
        [`${mark}:hover:not(:active) &`]: { vars: { [faceDrop]: inLogoUnits(-HOVER_LIFT) } }
      }
    }
  }
});

export const top = style({
  transform: `translateY(${faceDrop})`
});

const sweepDepth = `calc(${inLogoUnits(EXTRUSION)} - ${faceDrop})`;
const sweepMiddle = `calc((${inLogoUnits(EXTRUSION)} + ${faceDrop}) / 2)`;

export const swept = style({
  strokeLinejoin: "round",
  strokeWidth: sweepDepth,
  transform: `translateY(${sweepMiddle})`
});
