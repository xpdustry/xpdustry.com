import { cleanup, render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  readThemePreference,
  resolveTheme,
  THEME_BOOTSTRAP,
  THEME_STORAGE_KEY,
} from "#app/components/layout/theme";
import { ThemeProvider } from "#app/components/layout/ThemeProvider";
import { ThemeToggle } from "#app/components/layout/ThemeToggle";

function stubColorScheme(initiallyDark: boolean) {
  let dark = initiallyDark;
  const listeners = new Set<() => void>();
  const media = {
    get matches() {
      return dark;
    },
    media: "(prefers-color-scheme: dark)",
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    setDark(next: boolean) {
      dark = next;
      for (const listener of listeners) listener();
    },
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => media),
  );
  return media;
}

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  document.documentElement.style.colorScheme = "";
  stubColorScheme(false);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("theme preference", () => {
  test("uses a valid saved choice and otherwise follows the system", () => {
    expect(readThemePreference()).toBe("system");
    expect(resolveTheme("system", { matches: true })).toBe("dark");

    localStorage.setItem(THEME_STORAGE_KEY, "light");
    expect(readThemePreference()).toBe("light");
  });

  test("falls back to system when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage disabled");
    });
    expect(readThemePreference()).toBe("system");
  });

  test("the bootstrap applies only a saved override", () => {
    new Function(THEME_BOOTSTRAP)();
    expect(document.documentElement.dataset.theme).toBeUndefined();

    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    new Function(THEME_BOOTSTRAP)();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });
});

describe("<ThemeToggle />", () => {
  test("follows system changes until the user makes a choice", async () => {
    const media = stubColorScheme(false);
    render(() => (
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    ));

    expect(await screen.findByRole("button", { name: "Switch to the dark theme" })).toBeVisible();
    media.setDark(true);
    expect(await screen.findByRole("button", { name: "Switch to the light theme" })).toBeVisible();
  });

  test("persists an explicit choice and synchronizes every control", async () => {
    render(() => (
      <ThemeProvider>
        <ThemeToggle />
        <ThemeToggle block showLabel />
      </ThemeProvider>
    ));

    const controls = await screen.findAllByRole("button", { name: "Switch to the dark theme" });
    await userEvent.click(controls[0]);

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(
      await screen.findAllByRole("button", { name: "Switch to the light theme" }),
    ).toHaveLength(2);
  });
});
