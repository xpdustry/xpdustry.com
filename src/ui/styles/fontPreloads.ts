import cyrillicText from "@fontsource-variable/golos-text/files/golos-text-cyrillic-wght-normal.woff2?url";
import text from "@fontsource-variable/momo-trust-sans/files/momo-trust-sans-latin-wght-normal.woff2?url";
import mono from "@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2?url";
import cyrillicDisplay from "@fontsource/golos-text/files/golos-text-cyrillic-700-normal.woff2?url";
import cyrillicMono from "@fontsource/ibm-plex-mono/files/ibm-plex-mono-cyrillic-500-normal.woff2?url";
import display from "@fontsource/momo-trust-display/files/momo-trust-display-latin-400-normal.woff2?url";
import { preload } from "react-dom";

const FILES = {
  display: { latin: display, cyrillic: cyrillicDisplay, priority: "high" },
  mono: { latin: mono, cyrillic: cyrillicMono, priority: "low" },
  text: { latin: text, cyrillic: cyrillicText, priority: "high" }
} as const;

const CYRILLIC_LOCALES = new Set(["ru"]);

/**
 * Queue first-screen fonts before rendering children, whose images would otherwise take the
 * first preload slots. Other faces wait until the stylesheet needs them.
 */
export function preloadFonts(faces: readonly (keyof typeof FILES)[], locale: string) {
  for (const name of faces) {
    const face = FILES[name];
    const files = CYRILLIC_LOCALES.has(locale) ? [face.latin, face.cyrillic] : [face.latin];
    for (const href of files) {
      preload(href, {
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
        fetchPriority: face.priority
      });
    }
  }
}
