import { globalStyle } from "@vanilla-extract/css";
import { media } from "./media";
import { font, rem } from "./scale";
import { vars } from "./theme.css";

/** The canvas shows past either end of the page when it bounces, so it matches the crown and footer. */
globalStyle(":root", {
  background: vars.deep,
  colorScheme: "light",
  WebkitTextSizeAdjust: "100%",
  scrollPaddingTop: 16
});

globalStyle(":root[data-hydrated]", {
  "@media": {
    [media.motion]: { scrollBehavior: "smooth" }
  }
});

globalStyle("*, *::before, *::after", {
  boxSizing: "border-box"
});

/** A column at least a screen tall, so a short page still ends on its footer, not on the backdrop. */
globalStyle("body", {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  margin: 0,
  minHeight: "100vh",
  color: vars.ink,
  fontFamily: vars.fontDisplay,
  fontSize: rem(font.text),
  lineHeight: 1.55,
  overflowWrap: "break-word",
  letterSpacing: "0.02em",
  fontSynthesisWeight: "none",
  WebkitFontSmoothing: "antialiased"
});

globalStyle("button, input", {
  font: "inherit",
  color: "inherit"
});

globalStyle("h1, h2, h3, p, ul, ol, dl, dd, figure", {
  margin: 0
});

globalStyle("h1, h2, h3", {
  fontWeight: "inherit"
});

globalStyle("ul, ol", {
  padding: 0,
  listStyle: "none"
});

globalStyle("a", {
  color: "inherit"
});

globalStyle("img, svg, video, canvas", {
  display: "block",
  maxWidth: "100%"
});

globalStyle(":where(:focus-visible)", {
  outline: `3px solid ${vars.focus}`,
  outlineOffset: 3,
  borderRadius: 4
});

globalStyle(".wrap", {
  width: "min(1180px, 100% - 2 * clamp(20px, 5vw, 56px))",
  marginInline: "auto",
  padding: vars.gap
});

/** The page's own content takes up whatever height the screen has left over it. */
globalStyle("body > .wrap", {
  flexGrow: 1
});

globalStyle(".sr-only", {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap"
});

globalStyle(".skip-link", {
  position: "absolute",
  top: 12,
  left: 12,
  zIndex: 100,
  padding: "8px 14px",
  borderRadius: 10,
  background: vars.tile,
  color: vars.ink,
  translate: "0 -200%"
});

globalStyle(".skip-link:focus-visible", {
  translate: "none"
});

globalStyle("*, *::before, *::after", {
  "@media": {
    [media.still]: {
      animation: "none !important",
      transition: "none !important"
    }
  }
});
