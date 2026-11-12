import { expect, test } from "vitest";
import { seo } from "./meta";

test("escapes HTML script delimiters without changing the JSON-LD value", () => {
  const jsonLd = { "@context": "https://schema.org", name: "</script><script>alert(1)</script>" };
  const page = {
    title: "Test",
    description: "Test",
    path: "/",
    image: { url: "/a.png", alt: "A" }
  };
  const { scripts } = seo({ ...page, jsonLd });
  expect(scripts[0]?.type).toBe("application/ld+json");
  expect(scripts[0]?.children).not.toContain("<");
  expect(JSON.parse(scripts[0]!.children)).toEqual(jsonLd);
  expect(seo(page).scripts).toEqual([]);
});
