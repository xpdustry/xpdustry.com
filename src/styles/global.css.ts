import { globalStyle } from "@vanilla-extract/css";
import { palette } from "#app/styles/theme.css";

globalStyle('[data-theme="light"]', {
  colorScheme: "light",
});

globalStyle('[data-theme="dark"]', {
  colorScheme: "dark",
});

globalStyle("*, *::before, *::after", {
  boxSizing: "border-box",
});

globalStyle("body, h1, h2, h3, h4, p, figure, blockquote, dl, dd", {
  margin: 0,
});

globalStyle("button, input, select, textarea", {
  color: "inherit",
  font: "inherit",
});

globalStyle("h1, h2, h3, h4", {
  lineHeight: 1.2,
  textWrap: "balance",
});

globalStyle("p", {
  textWrap: "pretty",
});

globalStyle("a", {
  color: "inherit",
});

globalStyle("img, picture, video, canvas, svg", {
  display: "block",
  maxInlineSize: "100%",
});

globalStyle("img, video", {
  blockSize: "auto",
});

globalStyle(":focus-visible", {
  outline: "3px solid currentColor",
  outlineOffset: "3px",
});

globalStyle("::selection", {
  background: palette.accent,
  color: palette.onAccent,
});

globalStyle("html", {
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      scrollBehavior: "auto",
    },
  },
});

globalStyle("*, *::before, *::after", {
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      animationDuration: "1ms !important",
      animationIterationCount: "1 !important",
      transitionDuration: "1ms !important",
    },
  },
});
