import { createGlobalVar, globalStyle } from "@vanilla-extract/css";

export const faceFrom = createGlobalVar("face-from");
export const riseFrom = createGlobalVar("rise-from");

globalStyle(
  ':root[data-enter=""] [data-texture]:not([data-texture="rise"]), :root[data-enter] [data-texture="face"], [data-texture][data-held]',
  { opacity: 0 }
);
