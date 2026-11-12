import { expect, test } from "vitest";
import { postTitle, seo } from "#app/lib/seo";

test.each([
  ["Beta 11: Admin panel", "4", "NoHorny 4 Beta 11: Admin panel"],
  ["Beta 3", undefined, "NoHorny Beta 3"],
  ["Say hello to NoHorny v4 beta 1", "4", "Say hello to NoHorny v4 beta 1"],
  ["NOHORNY update", "4", "NOHORNY update"],
])("builds the post title for %s", (title, topicVersion, expected) => {
  expect(postTitle({ title, topic: "NoHorny", topicVersion })).toBe(expected);
});

test("escapes HTML script delimiters without changing the JSON-LD value", () => {
  const jsonLd = { "@context": "https://schema.org", name: "</script><script>alert(1)</script>" };
  const page = {
    title: "Test",
    description: "Test",
    path: "/",
    image: { url: "/a.png", alt: "A" },
  };
  const { scripts } = seo({ ...page, jsonLd });
  expect(scripts[0]?.type).toBe("application/ld+json");
  expect(scripts[0]?.children).not.toContain("<");
  expect(JSON.parse(scripts[0]!.children)).toEqual(jsonLd);
  expect(seo(page).scripts).toEqual([]);
});
