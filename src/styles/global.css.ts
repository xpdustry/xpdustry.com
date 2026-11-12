import { globalStyle } from "@vanilla-extract/css";
import { media } from "./media";
import { vars } from "./theme.css";

globalStyle(":root", {
  colorScheme: "light",
  WebkitTextSizeAdjust: "100%",
  scrollPaddingTop: 16,
});

globalStyle(":root[data-hydrated]", {
  "@media": {
    [media.motion]: { scrollBehavior: "smooth" },
  },
});

globalStyle("*, *::before, *::after", {
  boxSizing: "border-box",
});

globalStyle("body", {
  margin: 0,
  minHeight: "100vh",
  background: vars.page,
  color: vars.ink,
  fontFamily: vars.fontDisplay,
  fontSize: 17,
  lineHeight: 1.55,
  letterSpacing: "0.02em",
  fontSynthesisWeight: "none",
  WebkitFontSmoothing: "antialiased",
});

globalStyle("button, input", {
  font: "inherit",
  color: "inherit",
});

globalStyle("h1, h2, h3, p, ul, ol, dl, dd, figure", {
  margin: 0,
});

globalStyle("h1, h2, h3", {
  fontWeight: "inherit",
});

globalStyle("ul, ol", {
  padding: 0,
  listStyle: "none",
});

globalStyle("a", {
  color: "inherit",
});

globalStyle("img, svg, video, canvas", {
  display: "block",
  maxWidth: "100%",
});

globalStyle(":where(:focus-visible)", {
  outline: `3px solid ${vars.focus}`,
  outlineOffset: 3,
  borderRadius: 4,
});

globalStyle(".wrap", {
  width: "min(1180px, 100% - 2 * clamp(20px, 5vw, 56px))",
  marginInline: "auto",
  padding: vars.gap,
});

globalStyle(".sr-only", {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
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
  translate: "0 -200%",
});

globalStyle(".skip-link:focus-visible", {
  translate: "none",
});

globalStyle(":where(.spot)::after", {
  content: '""',
  position: "absolute",
  inset: -2,
  zIndex: 5,
  padding: 2,
  borderRadius: "inherit",
  pointerEvents: "none",
  opacity: "var(--spot, 0)",
  background: `radial-gradient(220px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgb(${vars.glow}), transparent 70%)`,
  mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
});

globalStyle("*, *::before, *::after", {
  "@media": {
    [media.still]: {
      animation: "none !important",
      transition: "none !important",
    },
  },
});
