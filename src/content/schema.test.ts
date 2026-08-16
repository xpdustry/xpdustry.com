import { describe, expect, test } from "vitest";
import { ContentError, parseBlogFrontmatter, parseDocFrontmatter } from "#app/content/schema";

const valid = {
  title: "Beta 8 blurs your alerts",
  description: "The last breaking change before the stable release.",
  publishedAt: "2026-07-20",
  author: "phinner",
  topic: "NoHorny",
};

describe("parseBlogFrontmatter", () => {
  test("accepts the required fields", () => {
    expect(parseBlogFrontmatter("a.mdx", valid)).toEqual({
      title: valid.title,
      description: valid.description,
      publishedAt: "2026-07-20T00:00:00.000Z",
      author: "phinner",
      topic: "NoHorny",
    });
  });

  test("accepts a Date, which is what YAML makes of an unquoted date", () => {
    const parsed = parseBlogFrontmatter("a.mdx", {
      ...valid,
      publishedAt: new Date("2026-07-20T00:00:00Z"),
    });
    expect(parsed.publishedAt).toBe("2026-07-20T00:00:00.000Z");
  });

  test("accepts an optional author picture", () => {
    expect(parseBlogFrontmatter("a.mdx", { ...valid, pfp: "/phinner.svg" }).pfp).toBe(
      "/phinner.svg",
    );
  });

  test.each(["title", "description", "publishedAt", "author", "topic"])(
    "rejects a missing %s",
    (key) => {
      const { [key]: _dropped, ...rest } = valid as Record<string, unknown>;
      expect(() => parseBlogFrontmatter("a.mdx", rest)).toThrow(ContentError);
    },
  );

  test("rejects an empty string where content is required", () => {
    expect(() => parseBlogFrontmatter("a.mdx", { ...valid, title: "   " })).toThrow(/title/);
  });

  test.each(["yesterday", "2026-13-45", ""])("rejects the bad date %j", (publishedAt) => {
    expect(() => parseBlogFrontmatter("a.mdx", { ...valid, publishedAt })).toThrow(/publishedAt/);
  });

  test("rejects an invalid updatedAt while allowing it to be absent", () => {
    expect(parseBlogFrontmatter("a.mdx", valid).updatedAt).toBeUndefined();
    expect(() => parseBlogFrontmatter("a.mdx", { ...valid, updatedAt: "soon" })).toThrow(
      /updatedAt/,
    );
  });

  test("accepts a well-formed release id", () => {
    const parsed = parseBlogFrontmatter("a.mdx", {
      ...valid,
      releases: ["xpdustry/nohorny@v4.0.0-beta.8"],
    });
    expect(parsed.releases).toEqual(["xpdustry/nohorny@v4.0.0-beta.8"]);
  });

  test.each(["nohorny@v1", "xpdustry/nohorny", "xpdustry/nohorny@", "@v1"])(
    "rejects the malformed release id %j",
    (id) => {
      expect(() => parseBlogFrontmatter("a.mdx", { ...valid, releases: [id] })).toThrow(
        /owner\/repo@tag/,
      );
    },
  );

  test("rejects a duplicate release id within one post", () => {
    expect(() =>
      parseBlogFrontmatter("a.mdx", {
        ...valid,
        releases: ["xpdustry/nohorny@v1", "xpdustry/nohorny@v1"],
      }),
    ).toThrow(/duplicate/);
  });

  test("names the file in the error, so a build failure points at the post", () => {
    expect(() => parseBlogFrontmatter("src/content/blog/broken.mdx", {})).toThrow(
      /^src\/content\/blog\/broken\.mdx:/,
    );
  });
});

describe("parseDocFrontmatter", () => {
  const doc = {
    title: "Install the plugin",
    description: "Drop one jar in config/mods.",
    order: 2,
  };

  test("accepts the required fields", () => {
    expect(parseDocFrontmatter("a.mdx", doc)).toEqual(doc);
  });

  test("rejects a missing or non-numeric order", () => {
    expect(() => parseDocFrontmatter("a.mdx", { ...doc, order: "2" })).toThrow(/order/);
    expect(() => parseDocFrontmatter("a.mdx", { ...doc, order: Number.NaN })).toThrow(/order/);
  });

  test("rejects frontmatter that is not a mapping", () => {
    expect(() => parseDocFrontmatter("a.mdx", ["title"])).toThrow(/mapping/);
    expect(() => parseDocFrontmatter("a.mdx", undefined)).toThrow(/mapping/);
  });
});
