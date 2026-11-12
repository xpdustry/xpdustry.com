import { describe, expect, test } from "vitest";
import { SITE } from "#app/brand/site";
import { releaseLabel, releaseUrl } from "./releases";

describe("releaseLabel", () => {
  test("names the project of a known repository, or the repository", () => {
    expect(releaseLabel("xpdustry/nohorny@v4.0.0")).toBe("NoHorny v4.0.0");
    expect(releaseLabel("someone/plugin@1.2")).toBe("plugin 1.2");
  });

  test("gives only the tag for a release of the post's own project", () => {
    expect(releaseLabel("xpdustry/nohorny@v4.0.0", "xpdustry/nohorny")).toBe("v4.0.0");
    expect(releaseLabel("xpdustry/claj@v2", "xpdustry/nohorny")).toBe("CLaJ v2");
  });

  test("keeps the tag after the last @ and leaves an id it cannot read as it is", () => {
    expect(releaseLabel("xpdustry/claj@scope@v2")).toBe("claj@scope v2");
    expect(releaseLabel("@v2")).toBe("@v2");
    expect(releaseLabel("xpdustry/claj@")).toBe("xpdustry/claj@");
  });
});

describe("releaseUrl", () => {
  test("links to the release's tag on GitHub, encoding each part", () => {
    expect(releaseUrl("xpdustry/nohorny@v4.0.0-beta.1")).toBe(
      "https://github.com/xpdustry/nohorny/releases/tag/v4.0.0-beta.1"
    );
    expect(releaseUrl("xpdustry/claj@a b#1")).toBe(
      "https://github.com/xpdustry/claj/releases/tag/a%20b%231"
    );
  });

  test("falls back to the organisation for an id it cannot read", () => {
    expect(releaseUrl("nothing")).toBe(SITE.github);
  });
});
