import { createVar, style } from "@vanilla-extract/css";
import { media } from "#app/ui/styles/media";

/** Depth of the extrusion, and the extra rise under the pointer, in logo units. */
const DEPTH = 30.72;
const LIFT = 19.2;

/**
 * Where the faces are, in logo units down from rest: the one thing a press changes. It is a
 * length the browser can run a transition on, and the shapes follow it. A transition on their
 * own transforms would have Chrome draw each on a layer of its own while it runs, at the
 * resolution of the squashed group they are in: a blur.
 */
const face = createVar({ syntax: "<length>", inherits: true, initialValue: "0px" });
/** Its name, which a transition goes by: `face` itself reads the value. */
const FACE = face.slice("var(".length, -1);

export const mark = style({
  flex: "none",
  margin: "-6px -4px -6px -8px",
  padding: 0,
  border: 0,
  background: "none",
  font: "inherit",
  // It is a button whatever the motion setting: a press spreads the card's colour either way.
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
  // The pointer is only ever over the mark, never over the shapes moving inside it.
  pointerEvents: "none",
  vars: { [face]: "0px" },
  "@media": {
    [media.motion]: {
      transition: `${FACE} 190ms cubic-bezier(0.25, 1, 0.5, 1)`,
      selectors: {
        [`${mark}:active &`]: { vars: { [face]: `${DEPTH}px` }, transitionDuration: "60ms" }
      }
    },
    [`${media.motion} and (hover: hover)`]: {
      selectors: {
        [`${mark}:hover:not(:active) &`]: { vars: { [face]: `${-LIFT}px` } }
      }
    }
  }
});

/** A shape's face. In an SVG, px in a transform or a stroke are the drawing's own units. */
export const top = style({
  transform: `translateY(${face})`
});

/**
 * A shape swept from its face down to the floor, as one path. The shapes are stored stretched
 * sideways and squashed back by their group, which leaves a round pen a vertical sliver: a stroke
 * then grows a shape up and down only. Stroked as wide as the sweep is deep and set halfway down
 * it, the shape covers everything between its face and the floor.
 */
export const swept = style({
  strokeLinejoin: "round",
  strokeWidth: `calc(${DEPTH}px - ${face})`,
  transform: `translateY(calc((${DEPTH}px + ${face}) / 2))`
});
