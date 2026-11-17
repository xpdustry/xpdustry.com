import { readdir, readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { describe, expect, test } from "vitest";
import { documentOf, get, html, textOf } from "#tests/support/served.ts";

/**
 * "The element containing the character encoding declaration must be serialized completely within
 * the first 1024 bytes of the document": https://html.spec.whatwg.org/multipage/semantics.html#charset
 * Past them, a browser's prescan gives up looking for it:
 * https://html.spec.whatwg.org/multipage/parsing.html#prescan-a-byte-stream-to-determine-its-encoding
 */
const CHARSET_WITHIN_BYTES = 1024;
const CHARSET = /<meta charset="utf-8"\/>/i;

// A single-byte decoding keeps one code unit per byte, so an index is a byte offset:
// https://encoding.spec.whatwg.org/#single-byte-decoder
const byteOffsets = new TextDecoder("windows-1252");

test.for(["/", "/ru"])(
  "%s declares its charset within the bytes a browser reads for it, ahead of any script",
  async (path) => {
    const response = await get(path);
    expect(response.headers.get("content-encoding")).toBeNull();
    const bytes = byteOffsets.decode(await response.arrayBuffer());
    const charset = CHARSET.exec(bytes);
    expect(charset).not.toBeNull();
    expect(charset!.index + charset![0].length).toBeLessThanOrEqual(CHARSET_WITHIN_BYTES);
    const firstScript = bytes.indexOf("<script");
    expect(firstScript).toBeGreaterThan(-1);
    expect(charset!.index).toBeLessThan(firstScript);
  }
);

const structuredData = (page: string) =>
  [...page.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(
    ([, data]) => JSON.parse(data!) as unknown
  );

const crumb = (position: number, name: string, path: string) => ({
  "@type": "ListItem",
  position,
  name,
  item: `https://xpdustry.com${path}`
});

describe("the blog", () => {
  test("lists every post once, the newest first", async () => {
    const posts = await readdir(new URL("../../src/blog/posts/en/", import.meta.url));
    const listed = [...(await documentOf("/blog")).querySelectorAll('main a[href^="/blog/"]')].map(
      (link) => link.getAttribute("href")
    );
    expect(new Set(listed)).toEqual(
      new Set(posts.map((file) => `/blog/${file.replace(/\.md$/, "")}`))
    );
    expect(listed[0]).toBe("/blog/nohorny-4-beta-11");
  });

  // Every crumb is a ListItem with a position, a name and an item URL; Google lets only the last
  // one leave its URL out: https://developers.google.com/search/docs/appearance/structured-data/breadcrumb#list-item
  test("a post renders on the server, its titles and structured data agreeing", async () => {
    const [slug, title] = [
      "nohorny-4-beta-8",
      "NoHorny 4 Beta 8: Breaking changes and blurred alerts"
    ];
    const page = await html(`/blog/${slug}`);
    for (const named of [
      "<title>",
      '<meta property="og:title" content="',
      '<meta name="twitter:title" content="'
    ]) {
      expect(page).toContain(`${named}${title} - Xpdustry`);
    }
    expect(structuredData(page)).toMatchObject([
      {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "BlogPosting",
            headline: title,
            author: { "@type": "Person", name: "phinner", url: "https://github.com/phinner" },
            publisher: { "@id": "https://xpdustry.com/#organization" },
            image: `https://xpdustry.com/og/blog/${slug}.png`,
            mainEntityOfPage: `https://xpdustry.com/blog/${slug}`
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              crumb(1, "Home", "/"),
              crumb(2, "Blog", "/blog"),
              crumb(3, title, `/blog/${slug}`)
            ]
          }
        ]
      }
    ]);
    const post = new JSDOM(page).window.document;
    expect(textOf(post.querySelector("main aside"))).toContain("Breaking change");
    expect(post.querySelector("main figure img")?.getAttribute("src")).toBe(
      "/blog/nohorny-discord-alert.webp"
    );
  });

  test.for([
    ["fr", "Accueil", "Blog", "juillet 2026"],
    ["ru", "Главная", "Блог", "июля 2026 г."]
  ])(
    "a %s post reads in its language, its date and breadcrumbs too",
    async ([locale, home, blog, month]) => {
      const page = await html(`/${locale}/blog/nohorny-4-beta-8`);
      const [data] = structuredData(page) as {
        "@graph": { "@type": string; itemListElement?: unknown[] }[];
      }[];
      const crumbs = data!["@graph"].find((node) => node["@type"] === "BreadcrumbList");
      expect(crumbs?.itemListElement?.slice(0, 2)).toEqual([
        crumb(1, home, `/${locale}`),
        crumb(2, blog, `/${locale}/blog`)
      ]);
      const date = textOf(new JSDOM(page).window.document.querySelector("main time"));
      expect(date.replace(/^\d+ /, "")).toBe(month);
    }
  );
});

test("home publishes the website and the organization behind it", async () => {
  expect(structuredData(await html("/"))).toMatchObject([
    {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "WebSite", "@id": "https://xpdustry.com/#website" },
        {
          "@type": "Organization",
          "@id": "https://xpdustry.com/#organization",
          logo: "https://xpdustry.com/icon-512.png"
        }
      ]
    }
  ]);
});

test.for(["/no-such-page", "/blog/no-such-post"])(
  "%s is a 404 kept out of search results",
  async (path) => {
    const response = await get(path);
    expect(response.status).toBe(404);
    const page = await response.text();
    expect(page).toContain("this page does not exist");
    expect(page).not.toContain('<link rel="canonical"');
    expect(page).toContain('<meta name="robots" content="noindex"');
  }
);

test.for(["/", "/blog/nohorny-4-beta-8"])(
  "%s opens the links that leave the site, and only those, in a new tab",
  async (path) => {
    const links = [...(await documentOf(path)).querySelectorAll("a[href]")];
    const leaving = links.filter((link) => /^https?:\/\//.test(link.getAttribute("href")!));
    expect(leaving.length).toBeGreaterThan(0);
    for (const link of leaving) {
      expect(link.getAttribute("target"), link.outerHTML).toBe("_blank");
      expect(link.getAttribute("rel"), link.outerHTML).toMatch(/^(noopener|noreferrer)$/);
    }
    for (const link of links.filter((link) => !leaving.includes(link))) {
      expect(link.hasAttribute("target"), link.outerHTML).toBe(false);
    }
  }
);

describe("post bodies", () => {
  test.for(["/", "/blog", "/no-such-page"])("%s preloads none of them", async (path) => {
    const preloads = [...(await documentOf(path)).querySelectorAll('link[rel="modulepreload"]')];
    expect(preloads.map((link) => link.getAttribute("href"))).not.toContainEqual(
      expect.stringMatching(/nohorny-4-beta-\d+-/)
    );
  });

  test("each is a chunk of its own, loaded only by its post", async () => {
    const assets = new URL("../../dist/client/assets/", import.meta.url);
    const bodies = (await readdir(assets)).filter((file) =>
      /^nohorny-4-beta-\d+-[^.]+\.js$/.test(file)
    );
    const posts = await readdir(new URL("../../src/blog/posts/", import.meta.url), {
      recursive: true
    });
    expect(bodies).toHaveLength(posts.filter((file) => file.endsWith(".md")).length);
    for (const body of bodies)
      expect(await readFile(new URL(body, assets), "utf8")).toContain("children");

    const preloads = [
      ...(await documentOf("/blog/nohorny-4-beta-8")).querySelectorAll('link[rel="modulepreload"]')
    ].map((link) => link.getAttribute("href"));
    expect(preloads).not.toContainEqual(expect.stringMatching(/nohorny-4-beta-(1|3|7|11)-/));
  });
});
