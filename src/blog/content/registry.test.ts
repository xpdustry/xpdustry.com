import { describe, expect, test } from "vitest";
import { assertReleasesAreClaimedOnce, posts, translated, type Post } from "./registry";
import type { BlogFrontmatter } from "./schema";

function post(slug: string, releases?: string[]): Post {
  const frontmatter = { releases } as BlogFrontmatter;
  return { slug, frontmatter, load: () => Promise.reject(new Error("not loaded")) };
}

test.each([
  ["accepts posts that list different releases, or none", [], undefined],
  [
    "names the second post that lists a release, and the first",
    [post("second", ["xpdustry/nohorny@v4", "xpdustry/claj@v2"])],
    "second: release xpdustry/claj@v2 is already claimed by first"
  ]
])("assertReleasesAreClaimedOnce %s", (_label, more: Post[], error) => {
  const check = () =>
    assertReleasesAreClaimedOnce([
      post("first", ["xpdustry/claj@v2"]),
      post("b"),
      post("c", ["xpdustry/nohorny@v4.0.0-beta.3"]),
      ...more
    ]);
  if (error) expect(check).toThrow(error);
  else expect(check).not.toThrow();
});

describe("translated", () => {
  test("gives a post in the asked language when it has one", () => {
    const english = posts[0]!;
    const french = translated(english, "fr");
    expect(french.slug).toBe(english.slug);
    expect(french.frontmatter.title).not.toBe(english.frontmatter.title);
  });

  test("gives the post itself when it has no translation", () => {
    const untranslated = post("only-in-english");
    expect(translated(untranslated, "fr")).toBe(untranslated);
    expect(translated(posts[0]!, "xx")).toBe(posts[0]);
  });
});
