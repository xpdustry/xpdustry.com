import cyrillicText from "@fontsource-variable/golos-text/files/golos-text-cyrillic-wght-normal.woff2?url";
import text from "@fontsource-variable/momo-trust-sans/files/momo-trust-sans-latin-wght-normal.woff2?url";
import mono from "@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2?url";
import cyrillicDisplay from "@fontsource/golos-text/files/golos-text-cyrillic-700-normal.woff2?url";
import cyrillicMono from "@fontsource/ibm-plex-mono/files/ibm-plex-mono-cyrillic-500-normal.woff2?url";
import display from "@fontsource/momo-trust-display/files/momo-trust-display-latin-400-normal.woff2?url";

const FILES = {
  display: { latin: display, cyrillic: cyrillicDisplay },
  mono: { latin: mono, cyrillic: cyrillicMono },
  text: { latin: text, cyrillic: cyrillicText },
};

const CYRILLIC_LOCALES = new Set(["ru"]);

/**
 * Preloads for the faces a page's first screen is set in, and their Cyrillic companions where
 * the page is in Russian. Every face loads anyway once text in it is laid out; a preload only
 * starts it before the stylesheet asks, which is worth it for the first screen and a waste of the
 * bandwidth that screen needs anywhere else.
 */
export function fontPreloads(faces: readonly (keyof typeof FILES)[], locale: string) {
  return faces
    .flatMap((face) =>
      CYRILLIC_LOCALES.has(locale)
        ? [FILES[face].latin, FILES[face].cyrillic]
        : [FILES[face].latin],
    )
    .map((href) => ({
      rel: "preload",
      href,
      as: "font",
      type: "font/woff2",
      crossOrigin: "anonymous" as const,
    }));
}
