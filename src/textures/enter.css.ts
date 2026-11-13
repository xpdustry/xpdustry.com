import { globalStyle } from "@vanilla-extract/css";

/**
 * Set from the head while textures are held back, until the page is parsed and each one's
 * animation holds it instead. Content never waits on it: only marked textures do.
 */
globalStyle(":root[data-enter] [data-texture]", {
  opacity: 0
});
