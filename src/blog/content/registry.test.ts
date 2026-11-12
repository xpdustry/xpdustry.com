import { describe, expect, test } from "vitest";
import { assertReleasesAreClaimedOnce, type Post } from "./registry";
import type { BlogFrontmatter } from "./schema";

function post(slug: string, releases?: string[]): Post {
  const frontmatter = { releases } as BlogFrontmatter;
  return { slug, frontmatter, load: () => Promise.reject(new Error("not loaded")) };
}

describe("assertReleasesAreClaimedOnce", () => {
  test("accepts posts that list different releases, or none", () => {
    expect(() =>
      assertReleasesAreClaimedOnce([
        post("a", ["xpdustry/nohorny@v4.0.0-beta.1"]),
        post("b"),
        post("c", ["xpdustry/nohorny@v4.0.0-beta.3", "xpdustry/claj@v2"])
      ])
    ).not.toThrow();
  });

  test("names the second post that lists a release, and the first", () => {
    expect(() =>
      assertReleasesAreClaimedOnce([
        post("first", ["xpdustry/claj@v2"]),
        post("second", ["xpdustry/nohorny@v4", "xpdustry/claj@v2"])
      ])
    ).toThrow("second: release xpdustry/claj@v2 is already claimed by first");
  });
});
