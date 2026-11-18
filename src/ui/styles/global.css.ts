import { globalStyle } from "@vanilla-extract/css";
import { ringOutside } from "./focus";
import { media } from "./media";
import { font, rem } from "./scale";
import { vars } from "./theme.css";

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
  ...ringOutside,
  borderRadius: 4
});

const PAGE_WIDTH = "1180px";
const NARROWEST_GUTTER = "clamp(20px, 5vw, 56px)";
export const pageGutter = `max(${NARROWEST_GUTTER}, (100% - ${PAGE_WIDTH}) / 2)`;

globalStyle(".wrap", {
  marginInline: pageGutter,
  padding: vars.gap
});

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
  maxWidth: "calc(100% - 24px)",
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
