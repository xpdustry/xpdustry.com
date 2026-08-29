import { style } from "@vanilla-extract/css";
import { colors, leading, type } from "#app/styles/theme.css";

export const html = style({
  colorScheme: "light dark",
  scrollPaddingTop: "5.5rem",
  WebkitTextSizeAdjust: "100%",
});

export const body = style({
  overflowX: "hidden",
  margin: 0,
  backgroundColor: colors.page,
  color: colors.ink,
  fontFamily: type.sans,
  fontSize: type.base,
  lineHeight: leading.body,
  textRendering: "optimizeLegibility",
  fontSynthesis: "none",
  WebkitFontSmoothing: "antialiased",
});
