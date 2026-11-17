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

  test("splits at the first @, since a repository name cannot hold one and a tag can", () => {
    expect(releaseLabel("xpdustry/claj@scope@v2")).toBe("CLaJ scope@v2");
    expect(releaseLabel("changesets/changesets@@changesets/cli@2.27.1")).toBe(
      "changesets @changesets/cli@2.27.1"
    );
  });

  test("leaves an id it cannot read as it is", () => {
    expect(releaseLabel("@v2")).toBe("@v2");
    expect(releaseLabel("xpdustry/claj@")).toBe("xpdustry/claj@");
  });
});

describe("releaseUrl", () => {
  test("links to the release's tag on GitHub, encoding each part", () => {
    expect(releaseUrl("xpdustry/nohorny@v4.0.0-beta.1")).toBe(
      "https://github.com/xpdustry/nohorny/releases/tag/v4.0.0-beta.1"
    );
    expect(releaseUrl("xpdustry/claj@v1#2")).toBe(
      "https://github.com/xpdustry/claj/releases/tag/v1%232"
    );
    expect(releaseUrl("xpdustry/claj@50%off")).toBe(
      "https://github.com/xpdustry/claj/releases/tag/50%25off"
    );
  });

  test("links to a tag holding an @ or a slash", () => {
    expect(releaseUrl("xpdustry/claj@scope@v2")).toBe(
      "https://github.com/xpdustry/claj/releases/tag/scope%40v2"
    );
    expect(releaseUrl("changesets/changesets@@changesets/cli@2.27.1")).toBe(
      "https://github.com/changesets/changesets/releases/tag/%40changesets%2Fcli%402.27.1"
    );
  });

  test("falls back to the organisation for an id it cannot read", () => {
    expect(releaseUrl("nothing")).toBe(SITE.github);
  });
});
