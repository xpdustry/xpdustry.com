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
type Priority = "high" | "low";

const QUEUE_ORDER: Record<Priority, number> = { high: 0, low: 1 };

const CYRILLIC_LOCALES = new Set(["ru"]);

export function preloadFonts(priorities: Record<Face, Priority>, locale: string) {
  const faces = (Object.keys(FILES) as Face[]).toSorted(
    (a, b) => QUEUE_ORDER[priorities[a]] - QUEUE_ORDER[priorities[b]]
  );
  for (const face of faces) {
    const { latin, cyrillic } = FILES[face];
    for (const href of CYRILLIC_LOCALES.has(locale) ? [latin, cyrillic] : [latin]) {
      preload(href, {
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
        fetchPriority: priorities[face]
      });
    }
  }
}
