import { createRouter, memoryHistory } from "@solidjs/router";
import { cleanup, render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "vitest";
import { SiteHeader } from "#app/components/layout/SiteHeader";
import { ThemeProvider } from "#app/components/layout/ThemeProvider";

afterEach(cleanup);

function renderHeader(path = "/") {
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
  test("marks the current page", () => {
    renderHeader("/blog");
    const current = screen.getAllByRole("link", { name: "Blog" })[0];
    expect(current).toHaveAttribute("aria-current", "page");
  });

  test("opens and exposes the drawer state", async () => {
    renderHeader();
    expect(burger()).toHaveAttribute("aria-expanded", "false");
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

  test("following a link from the drawer closes it", async () => {
    renderHeader();
    await userEvent.click(burger());

    const drawer = document.getElementById("site-drawer")!;
    const blogLink = [...drawer.querySelectorAll("a")].find(
      (link) => link.textContent?.trim() === "Blog",
    )!;
    await userEvent.click(blogLink);

    expect(await screen.findByRole("button", { name: /open menu/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(document.getElementById("site-drawer")).toBeNull();
  });
});
