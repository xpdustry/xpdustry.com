/**
 * Theme resolution, shared by the inline bootstrap and the toggle.
 *
 * The bootstrap runs as a blocking classic script in <head> so the resolved
 * theme is on <html> before the first paint. Applying it after hydration
 * would flash the wrong theme on every load.
 */

export type ThemeChoice = "light" | "dark";

export const THEME_STORAGE_KEY = "xpdustry-theme";

/**
 * Stringified into the document head. It has to stay ES5-ish and free of any
 * import, because it runs before the bundle exists.
 */
// TODO This smells...
export const THEME_BOOTSTRAP = `(function(){try{
var stored=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
var theme=stored==='light'||stored==='dark'?stored
  :(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
document.documentElement.dataset.theme=theme;
}catch(e){document.documentElement.dataset.theme=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}})();`;

export function readStoredTheme(): ThemeChoice | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    // Private mode, or storage disabled. The system preference still works.
    return null;
  }
}

export function systemTheme(): ThemeChoice {
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(theme: ThemeChoice): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Nothing to persist to. The choice still applies for this page.
  }
}
