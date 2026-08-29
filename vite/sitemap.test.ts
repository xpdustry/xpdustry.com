import { describe, expect, test } from "vitest";
import { blogRoutes, generateSitemapXml } from "./sitemap";

describe("sitemap", () => {
  test("generates absolute URLs", async () => {
    const sitemap = await generateSitemapXml("https://xpdustry.com", ["/", "/blog"]);

    expect(sitemap).toContain("<loc>https://xpdustry.com/</loc>");
    expect(sitemap).toContain("<loc>https://xpdustry.com/blog</loc>");
  });

  test("discovers published blog routes", async () => {
    const routes = await blogRoutes(new URL("../src/content/blog/", import.meta.url));

    expect(routes).toEqual([...routes].sort());
    expect(routes).toEqual(
      expect.arrayContaining(["/blog/nohorny-4-beta-1", "/blog/nohorny-4-beta-8"]),
    );
  });
});
