import { globalFontFace } from "@vanilla-extract/css";
import { CYRILLIC_DISPLAY_SOURCE_WEIGHT, DISPLAY_WEIGHT, FACE } from "./fonts";

const CYRILLIC = "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116";
const GOLOS_TO_DISPLAY_SIZE = "104%";

const companion = { fontStyle: "normal", fontDisplay: "swap", unicodeRange: CYRILLIC } as const;
const file = (path: string, format = "woff2") => `url("${path}") format("${format}")`;

globalFontFace(FACE.cyrillicDisplay, {
  ...companion,
  fontWeight: DISPLAY_WEIGHT,
  sizeAdjust: GOLOS_TO_DISPLAY_SIZE,
  src: file(
    `@fontsource/golos-text/files/golos-text-cyrillic-${CYRILLIC_DISPLAY_SOURCE_WEIGHT}-normal.woff2`
  )
});

globalFontFace(FACE.cyrillicText, {
  ...companion,
  fontWeight: "400 900",
  src: file(
    "@fontsource-variable/golos-text/files/golos-text-cyrillic-wght-normal.woff2",
    "woff2-variations"
  )
});

for (const weight of [400, 500]) {
  globalFontFace(FACE.cyrillicMono, {
    ...companion,
    fontWeight: weight,
    src: file(`@fontsource/ibm-plex-mono/files/ibm-plex-mono-cyrillic-${weight}-normal.woff2`)
  });
}
