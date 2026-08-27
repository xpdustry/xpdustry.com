import { createRouter, memoryHistory } from "@solidjs/router";
import { cleanup, render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "vitest";
import { SiteHeader } from "#app/components/layout/SiteHeader";
import { ThemeProvider } from "#app/components/layout/ThemeProvider";

afterEach(cleanup);

function renderHeader(path = "/") {
  // A memory history keeps the test off the jsdom URL bar and gives it a
  // handle to navigate with, which is how the drawer's close-on-navigate
  // behaviour gets exercised.
  const history = memoryHistory(path);
  const Router = createRouter({
    history,
    routes: [
      {
        path: "*",
        component: () => (
          <ThemeProvider>
            <SiteHeader />
          </ThemeProvider>
        ),
      },
    ],
  });
  const result = render(() => <Router>{(props) => props.children}</Router>);
  return { ...result, history };
}

const burger = () => screen.getByRole("button", { name: /menu/i });

describe("<SiteHeader />", () => {
  test("offers the agreed navigation and nothing else", () => {
    renderHeader();
    for (const label of ["Home", "Blog"]) {
      expect(screen.getAllByRole("link", { name: label }).length).toBeGreaterThan(0);
    }
    expect(screen.queryByRole("link", { name: "Projects" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Docs" })).toBeNull();
    // No search, no command palette hint, no newsletter, no Twitter/X.
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(screen.queryByText(/⌘K/)).toBeNull();
    expect(screen.queryByRole("link", { name: /twitter|x\.com/i })).toBeNull();
  });

  test("marks the current page", () => {
    renderHeader("/blog");
    const current = screen.getAllByRole("link", { name: "Blog" })[0];
    expect(current).toHaveAttribute("aria-current", "page");
  });

  test("the drawer starts closed and the trigger says so", () => {
    renderHeader();
    expect(burger()).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById("site-drawer")).toBeNull();
  });

  test("the trigger opens the drawer and updates its own state", async () => {
    renderHeader();
    await userEvent.click(burger());

    expect(burger()).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById("site-drawer")).toBeInTheDocument();
  });

  test("Escape closes the drawer and returns focus to the trigger", async () => {
    renderHeader();
    const trigger = burger();
    await userEvent.click(trigger);

    await userEvent.keyboard("{Escape}");

    expect(document.getElementById("site-drawer")).toBeNull();
    expect(burger()).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(burger());
  });

  test("Escape with the drawer closed does nothing", async () => {
    renderHeader();
    document.body.focus();
    await userEvent.keyboard("{Escape}");
    expect(burger()).toHaveAttribute("aria-expanded", "false");
  });

  test("following a link from the drawer closes it", async () => {
    renderHeader();
    await userEvent.click(burger());

    const drawer = document.getElementById("site-drawer")!;
    const blogLink = [...drawer.querySelectorAll("a")].find(
      (link) => link.textContent?.trim() === "Blog",
    )!;
    await userEvent.click(blogLink);

    // A drawer left open over the page you just asked for is a bug.
    expect(await screen.findByRole("button", { name: /open menu/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(document.getElementById("site-drawer")).toBeNull();
  });

  test("the trigger owns the drawer it controls", async () => {
    renderHeader();
    expect(burger()).toHaveAttribute("aria-controls", "site-drawer");
    await userEvent.click(burger());
    expect(document.getElementById("site-drawer")).toBeInTheDocument();
  });

  test("social links point at the agreed destinations and leak no referrer", () => {
    renderHeader();
    const github = screen.getAllByRole("link", { name: /github/i })[0];
    const discord = screen.getAllByRole("link", { name: /discord/i })[0];
    expect(github).toHaveAttribute("href", "https://github.com/xpdustry");
    expect(discord).toHaveAttribute("href", "https://discord.xpdustry.com");
    expect(github).toHaveAttribute("rel", "noreferrer");
  });
});
