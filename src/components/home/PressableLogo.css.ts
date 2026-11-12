import { globalStyle, style } from "@vanilla-extract/css";

export const mark = style({
  flex: "none",
  margin: "-6px -4px -6px -8px",
  cursor: "pointer",
  userSelect: "none",
  WebkitTouchCallout: "none"
});

globalStyle(`${mark} img, ${mark} canvas`, {
  display: "block",
  width: "100%",
  height: "auto"
});
