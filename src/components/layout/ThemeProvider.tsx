import {
  createContext,
  createEffect,
  createSignal,
  type Accessor,
  type ParentProps,
  useContext,
} from "solid-js";
import {
  applyTheme,
  readStoredTheme,
  systemTheme,
  type ThemeChoice,
} from "#app/components/layout/theme";

interface ThemeContextValue {
  theme: Accessor<ThemeChoice | null>;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>();

/** Owns the hydrated theme state shared by every theme control. */
export function ThemeProvider(props: ParentProps) {
  const [theme, setTheme] = createSignal<ThemeChoice | null>(null);

  createEffect(
    () => typeof document !== "undefined",
    (isClient) => {
      if (!isClient) return;
      const resolved =
        (document.documentElement.dataset.theme as ThemeChoice | undefined) ??
        readStoredTheme() ??
        systemTheme();
      setTheme(resolved);
    },
  );

  const toggleTheme = () => {
    const target = theme() === "dark" ? "light" : "dark";
    applyTheme(target);
    setTheme(target);
  };

  return <ThemeContext value={{ theme, toggleTheme }}>{props.children}</ThemeContext>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
