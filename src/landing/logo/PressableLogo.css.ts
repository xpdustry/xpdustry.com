import { globalStyle, style } from "@vanilla-extract/css";

export const mark = style({
  flex: "none",
  margin: "-6px -4px -6px -8px",
  cursor: "pointer",
  userSelect: "none",
  WebkitTouchCallout: "none",
  selectors: {
    "&:not([data-animated]):active": { transform: "translateY(2px) scale(0.96)" }
  }
});

globalStyle(`${mark} img, ${mark} canvas`, {
  display: "block",
  width: "100%",
  height: "auto"
});
