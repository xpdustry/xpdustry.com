/**
 * The site's faces, and the companions that draw the Cyrillic they lack. A companion is declared
 * for Cyrillic letters only, so Latin text keeps the site's own faces.
 */
export const FACE = {
  display: "Momo Trust Display",
  text: "Momo Trust Sans Variable",
  mono: "DM Mono",
  cyrillicDisplay: "Golos Display",
  cyrillicText: "Golos Text",
  cyrillicMono: "Plex Mono Cyrillic"
} as const;

/** The display face's one weight: heavy, under the name regular. */
export const DISPLAY_WEIGHT = 400;

/** The weight of Golos Text that matches the display face, served under `DISPLAY_WEIGHT`. */
export const CYRILLIC_DISPLAY_SOURCE_WEIGHT = 700;
