import {
  createContext,
  createSignal,
  onSettled,
  type Accessor,
  type ParentProps,
  useContext,
} from "solid-js";
import {
  applyThemePreference,
  readThemePreference,
  resolveTheme,
  THEME_QUERY,
  type ResolvedTheme,
  type ThemePreference,
} from "#app/components/layout/theme";

interface ThemeContextValue {
  preference: Accessor<ThemePreference>;
  resolved: Accessor<ResolvedTheme>;
  setPreference: (preference: ThemePreference) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>();

export function ThemeProvider(props: ParentProps) {
  const [preference, setPreferenceSignal] = createSignal<ThemePreference>("system");
  const [resolved, setResolved] = createSignal<ResolvedTheme>("light");
  let media: MediaQueryList | undefined;

  const sync = (next: ThemePreference) => {
    if (!media) return;
    setPreferenceSignal(next);
    setResolved(resolveTheme(next, media));
    applyThemePreference(next);
  };

  onSettled(() => {
    media = window.matchMedia(THEME_QUERY);
    sync(readThemePreference());

    const handleSystemChange = () => {
      if (preference() === "system") setResolved(resolveTheme("system", media!));
    };
    media.addEventListener("change", handleSystemChange);
    return () => media?.removeEventListener("change", handleSystemChange);
  });

  const value: ThemeContextValue = {
    preference,
    resolved,
    setPreference: sync,
    toggle: () => sync(resolved() === "dark" ? "light" : "dark"),
  };

  return <ThemeContext value={value}>{props.children}</ThemeContext>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
