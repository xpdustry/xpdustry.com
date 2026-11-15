import { globalStyle, style } from "@vanilla-extract/css";

export const mark = style({
  flex: "none",
  margin: "-6px -4px -6px -8px",
  userSelect: "none",
  WebkitTouchCallout: "none",
  selectors: {
    "&[data-animated]": { cursor: "pointer" }
  }
});

globalStyle(`${mark} img, ${mark} canvas`, {
  display: "block",
  width: "100%",
  height: "auto"
});
