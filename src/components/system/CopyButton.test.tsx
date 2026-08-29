import { cleanup, render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { CopyButton } from "#app/components/system/CopyButton";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function stubClipboard(writeText: ((text: string) => Promise<void>) | null) {
  vi.stubGlobal("navigator", {
    ...navigator,
    clipboard: writeText ? { writeText } : undefined,
  });
}

describe("<CopyButton />", () => {
  test("copies the exact value it was given", async () => {
    const writeText = vi.fn(async () => {});
    stubClipboard(writeText);

    render(() => <CopyButton value="survival.md.xpdustry.com" label="Copy address" />);
    await userEvent.click(screen.getByRole("button", { name: "Copy address" }));

    expect(writeText).toHaveBeenCalledWith("survival.md.xpdustry.com");
  });

  test("reports success on the button and to assistive technology", async () => {
    stubClipboard(async () => {});
    render(() => <CopyButton value="hub.md.xpdustry.com" announcement="Copied hub" />);

    await userEvent.click(screen.getByRole("button"));

    expect(await screen.findByRole("button", { name: "Copied" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Copied hub");
  });

  test("reports failure and tells the user what to do instead", async () => {
    stubClipboard(async () => {
      throw new Error("permission denied");
    });
    render(() => <CopyButton value="pvp.md.xpdustry.com" />);

    await userEvent.click(screen.getByRole("button"));

    expect(await screen.findByRole("button", { name: "Copy failed" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Could not copy. Select pvp.md.xpdustry.com and copy it manually.",
    );
  });

  test("fails gracefully when there is no Clipboard API at all", async () => {
    stubClipboard(null);
    render(() => <CopyButton value="event.md.xpdustry.com" />);

    await userEvent.click(screen.getByRole("button"));

    expect(await screen.findByRole("button", { name: "Copy failed" })).toBeInTheDocument();
  });

  test("the live region is polite, so it never interrupts", () => {
    render(() => <CopyButton value="x" />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });
});
