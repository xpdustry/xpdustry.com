import { expect, test } from "vitest";
import { seo } from "./meta";

const page = { title: "Test", description: "Test", path: "/", image: { url: "/a.png", alt: "A" } };

test("writes structured data that cannot close its script tag, and reads back the same", () => {
  const jsonLd = { "@context": "https://schema.org", name: "</script><script>alert(1)</script>" };

  const [script] = seo({ ...page, jsonLd }).scripts;

  expect(script?.type).toBe("application/ld+json");
  expect(script?.children).not.toContain("<");
  expect(JSON.parse(script!.children)).toEqual(jsonLd);
});

test("writes no structured data for a page without any", () => {
  expect(seo(page).scripts).toEqual([]);
});
