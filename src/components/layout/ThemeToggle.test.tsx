import { cleanup, render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  THEME_BOOTSTRAP,
  THEME_STORAGE_KEY,
  readStoredTheme,
  systemTheme,
} from "#app/components/layout/theme";
import { ThemeProvider } from "#app/components/layout/ThemeProvider";
import { ThemeToggle } from "#app/components/layout/ThemeToggle";

function renderToggle(props: Parameters<typeof ThemeToggle>[0] = {}) {
  return render(() => (
    <ThemeProvider>
      <ThemeToggle {...props} />
    </ThemeProvider>
  ));
}

/** Emulates prefers-color-scheme, which jsdom does not implement. */
function stubPrefersDark(dark: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("dark") ? dark : false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  );
}

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  stubPrefersDark(false);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  // The suite runs with isolate: false, so a spy left in place would leak
  // into every test after it.
  vi.restoreAllMocks();
});

describe("theme resolution", () => {
  test("follows the system preference on a first visit", () => {
    stubPrefersDark(true);
    expect(readStoredTheme()).toBeNull();
    expect(systemTheme()).toBe("dark");
  });

  test("an explicit choice wins over the system preference", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    stubPrefersDark(true);
    expect(readStoredTheme()).toBe("light");
  });

  test("ignores a stored value that is not a theme", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "neon");
    expect(readStoredTheme()).toBeNull();
  });

  test("survives storage being unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage disabled");
    });
    // Private mode must not break the page; the system preference still works.
    expect(readStoredTheme()).toBeNull();
  });
});

describe("the inline bootstrap", () => {
  test("resolves a stored choice before anything else runs", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    stubPrefersDark(false);
    new Function(THEME_BOOTSTRAP)();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  test("falls back to the system preference with nothing stored", () => {
    stubPrefersDark(true);
    new Function(THEME_BOOTSTRAP)();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  test("still sets a theme when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage disabled");
    });
    new Function(THEME_BOOTSTRAP)();
    // Anything but an unset attribute, which would leave the page unstyled.
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  test("carries no import or modern syntax, because it runs before the bundle", () => {
    expect(THEME_BOOTSTRAP).not.toMatch(/\bimport\b|=>|\blet\b|\bconst\b/);
  });
});

describe("<ThemeToggle />", () => {
  test("has an accessible name", async () => {
    document.documentElement.dataset.theme = "light";
    renderToggle();
    expect(
      await screen.findByRole("button", { name: "Switch to the dark theme" }),
    ).toBeInTheDocument();
  });

  test("applies the choice to the document and persists it", async () => {
    document.documentElement.dataset.theme = "light";
    renderToggle();

    await userEvent.click(await screen.findByRole("button"));

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  test("flips back, and the name follows", async () => {
    document.documentElement.dataset.theme = "dark";
    renderToggle();

    const button = await screen.findByRole("button", { name: "Switch to the light theme" });
    await userEvent.click(button);

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(
      await screen.findByRole("button", { name: "Switch to the dark theme" }),
    ).toBeInTheDocument();
  });

  test("is a native button, so it is keyboard operable", () => {
    renderToggle();
    const button = screen.getByRole("button");
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("type", "button");
  });

  test("the drawer variant shows a visible label instead of only an icon", async () => {
    document.documentElement.dataset.theme = "light";
    renderToggle({ block: true, showLabel: true });
    expect(await screen.findByText("Switch to the dark theme")).toBeInTheDocument();
  });

  test("keeps multiple controls in sync", async () => {
    document.documentElement.dataset.theme = "light";
    render(() => (
      <ThemeProvider>
        <ThemeToggle />
        <ThemeToggle block showLabel />
      </ThemeProvider>
    ));

    const controls = await screen.findAllByRole("button", { name: "Switch to the dark theme" });
    await userEvent.click(controls[0]);

    expect(
      await screen.findAllByRole("button", { name: "Switch to the light theme" }),
    ).toHaveLength(2);
  });
});
