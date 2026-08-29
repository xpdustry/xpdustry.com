export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "xpdustry-theme";
export const THEME_QUERY = "(prefers-color-scheme: dark)";

export const THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;}}catch(e){}})();`;

export function readThemePreference(
  storage: Pick<Storage, "getItem"> = localStorage,
): ThemePreference {
  try {
    const value = storage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

export function resolveTheme(
  preference: ThemePreference,
  media: Pick<MediaQueryList, "matches">,
): ResolvedTheme {
  return preference === "system" ? (media.matches ? "dark" : "light") : preference;
}

export function applyThemePreference(preference: ThemePreference): void {
  const root = document.documentElement;
  if (preference === "system") {
    delete root.dataset.theme;
    root.style.colorScheme = "light dark";
  } else {
    root.dataset.theme = preference;
    root.style.colorScheme = preference;
  }

  try {
    if (preference === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {}
}
