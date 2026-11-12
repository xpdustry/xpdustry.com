import { expect, test } from "vitest";
import { parseBlogFrontmatter } from "#app/content/schema";

const valid = {
  title: "Beta 8 blurs your alerts",
  description: "The last breaking change before the stable release.",
  publishedAt: "2026-07-20",
  author: "phinner",
  topic: "NoHorny"
};

test.each(["2024-02-29", new Date("2024-02-29T00:00:00Z")])(
  "normalizes YAML date input %s to UTC",
  (publishedAt) => {
    expect(parseBlogFrontmatter("a.md", { ...valid, publishedAt }).publishedAt).toBe(
      "2024-02-29T00:00:00.000Z"
    );
  }
);

test.each(["2026-02-29", "2026-04-31"])("rejects calendar rollover for %s", (publishedAt) => {
  expect(() => parseBlogFrontmatter("a.md", { ...valid, publishedAt })).toThrow(/publishedAt/);
});

test("rejects duplicate release references within a post", () => {
  expect(() =>
    parseBlogFrontmatter("a.md", {
      ...valid,
      releases: ["xpdustry/nohorny@v1", "xpdustry/nohorny@v1"]
    })
  ).toThrow(/duplicate/);
});

test("accepts a version line and rejects blank or non-string versions", () => {
  expect(parseBlogFrontmatter("a.md", { ...valid, topicVersion: "4" }).topicVersion).toBe("4");
  for (const topicVersion of ["", "  ", 4]) {
    expect(() => parseBlogFrontmatter("a.md", { ...valid, topicVersion })).toThrow(/topicVersion/);
  }
});
