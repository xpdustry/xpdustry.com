import { describe, expect, test } from "vitest";
import { ContentError, parseBlogFrontmatter } from "#app/content/schema";

const valid = {
  title: "Beta 8 blurs your alerts",
  description: "The last breaking change before the stable release.",
  publishedAt: "2026-07-20",
  author: "phinner",
  topic: "NoHorny",
};

describe("parseBlogFrontmatter", () => {
  test("accepts the required fields", () => {
    expect(parseBlogFrontmatter("a.md", valid)).toEqual({
      title: valid.title,
      description: valid.description,
      publishedAt: "2026-07-20T00:00:00.000Z",
      author: "phinner",
      topic: "NoHorny",
    });
  });

  test("accepts a Date, which is what YAML makes of an unquoted date", () => {
    const parsed = parseBlogFrontmatter("a.md", {
      ...valid,
      publishedAt: new Date("2026-07-20T00:00:00Z"),
    });
    expect(parsed.publishedAt).toBe("2026-07-20T00:00:00.000Z");
  });

  test("accepts an optional author picture", () => {
    expect(parseBlogFrontmatter("a.md", { ...valid, pfp: "/phinner.svg" }).pfp).toBe(
      "/phinner.svg",
    );
  });

  test.each(["title", "description", "publishedAt", "author", "topic"])(
    "rejects a missing %s",
    (key) => {
      const { [key]: _dropped, ...rest } = valid as Record<string, unknown>;
      expect(() => parseBlogFrontmatter("a.md", rest)).toThrow(ContentError);
    },
  );

  test("rejects an empty string where content is required", () => {
    expect(() => parseBlogFrontmatter("a.md", { ...valid, title: "   " })).toThrow(/title/);
  });

  test.each(["yesterday", "2026-13-45", ""])("rejects the bad date %j", (publishedAt) => {
    expect(() => parseBlogFrontmatter("a.md", { ...valid, publishedAt })).toThrow(/publishedAt/);
  });

  test("rejects an invalid updatedAt while allowing it to be absent", () => {
    expect(parseBlogFrontmatter("a.md", valid).updatedAt).toBeUndefined();
    expect(() => parseBlogFrontmatter("a.md", { ...valid, updatedAt: "soon" })).toThrow(
      /updatedAt/,
    );
  });

  test("accepts a well-formed release id", () => {
    const parsed = parseBlogFrontmatter("a.md", {
      ...valid,
      releases: ["xpdustry/nohorny@v4.0.0-beta.8"],
    });
    expect(parsed.releases).toEqual(["xpdustry/nohorny@v4.0.0-beta.8"]);
  });

  test.each(["nohorny@v1", "xpdustry/nohorny", "xpdustry/nohorny@", "@v1"])(
    "rejects the malformed release id %j",
    (id) => {
      expect(() => parseBlogFrontmatter("a.md", { ...valid, releases: [id] })).toThrow(
        /owner\/repo@tag/,
      );
    },
  );

  test("rejects a duplicate release id within one post", () => {
    expect(() =>
      parseBlogFrontmatter("a.md", {
        ...valid,
        releases: ["xpdustry/nohorny@v1", "xpdustry/nohorny@v1"],
      }),
    ).toThrow(/duplicate/);
  });

  test("names the file in the error, so a build failure points at the post", () => {
    expect(() => parseBlogFrontmatter("src/content/blog/broken.md", {})).toThrow(
      /^src\/content\/blog\/broken\.md:/,
    );
  });
});
