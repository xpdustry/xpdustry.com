import { globalStyle, style } from "@vanilla-extract/css";

export const mark = style({
  flex: "none",
  // past the relief's own transparent margin, so the logo sits flush with the name
  margin: "-6px -4px -6px -8px",
  cursor: "pointer",
  // a press is the toy's own; no text selection or long-press menu on it
  userSelect: "none",
  WebkitTouchCallout: "none",
});

globalStyle(`${mark} img, ${mark} canvas`, {
  display: "block",
  width: "100%",
  height: "auto",
});
