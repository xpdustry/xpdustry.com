import { describe, expect, test } from "vitest";
import { topic } from "./topics";

describe("topic", () => {
  test("takes the icon, website and theme of the project it names, in any case", () => {
    const nohorny = topic("nohorny");

    expect(nohorny.name).toBe("nohorny");
    expect(nohorny.icon).toBeDefined();
    expect(nohorny.website).toBe("https://nohorny.xpdustry.com");
    expect(nohorny.chip.background).toBe("#f9a3c7");
  });

  test("falls back to the site's theme for a project without one", () => {
    const claj = topic("CLaJ");

    expect(claj.icon).toBeDefined();
    expect(claj.website).toBeUndefined();
    expect(claj.ground).toBe(topic("Announcements").ground);
  });

  test("gives a topic that names no project the site's theme and no icon", () => {
    const other = topic("Announcements");

    expect(other.icon).toBeUndefined();
    expect(other.website).toBeUndefined();
    expect(other.ground).toBe("#083230");
  });
});
