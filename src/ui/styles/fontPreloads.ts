import cyrillicText from "@fontsource-variable/golos-text/files/golos-text-cyrillic-wght-normal.woff2?url";
import text from "@fontsource-variable/momo-trust-sans/files/momo-trust-sans-latin-wght-normal.woff2?url";
import mono from "@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2?url";
import cyrillicDisplay from "@fontsource/golos-text/files/golos-text-cyrillic-700-normal.woff2?url";
import cyrillicMono from "@fontsource/ibm-plex-mono/files/ibm-plex-mono-cyrillic-500-normal.woff2?url";
import display from "@fontsource/momo-trust-display/files/momo-trust-display-latin-400-normal.woff2?url";
import { preload } from "react-dom";

const FILES = {
  display: { latin: display, cyrillic: cyrillicDisplay },
  mono: { latin: mono, cyrillic: cyrillicMono },
  text: { latin: text, cyrillic: cyrillicText }
} as const;

type Face = keyof typeof FILES;

const CYRILLIC_LOCALES = new Set(["ru"]);

/**
 * Queue the page's fonts before rendering children, whose images would otherwise take the first
 * preload slots, in the order given and each at its priority. A face is asked for once, at the
 * priority of the first to ask, so the whole page's faces are named together.
 *
 * Every face a first screen draws with is here, however little it draws: one left to the
 * stylesheet is only found once the page is laid out, and its text swaps long after the rest.
 */
export function preloadFonts(faces: Partial<Record<Face, "high" | "low">>, locale: string) {
  for (const [name, priority] of Object.entries(faces) as [Face, "high" | "low"][]) {
    const face = FILES[name];
    const files = CYRILLIC_LOCALES.has(locale) ? [face.latin, face.cyrillic] : [face.latin];
    for (const href of files) {
      preload(href, {
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
        fetchPriority: priority
      });
    }
  }
}
