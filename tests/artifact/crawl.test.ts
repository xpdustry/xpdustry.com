import { readdir } from "node:fs/promises";
import { decode } from "fast-png";
import { JSDOM } from "jsdom";
import { beforeAll, describe, expect, test } from "vitest";
import { SITE } from "#app/brand/site.ts";
import { pathLocale } from "#app/i18n/localePath.ts";
import { DEFAULT_LOCALE, LOCALES } from "#app/i18n/locales.ts";
import { get, html, textOf } from "#tests/support/served.ts";

/**
 * Site policy, not a search engine's rule: Google cuts titles and snippets by pixel width and
 * sets no limit. These keep them whole in its results on a phone.
 */
const POLICY = { titleMax: 70, description: { min: 50, max: 170 }, cardMaxAge: "max-age=3600" };
/** Open Graph's four required properties: https://ogp.me/#metadata */
const OPEN_GRAPH_REQUIRED = ["og:title", "og:type", "og:image", "og:url"];
/** X needs a card type: https://developer.x.com/en/docs/x-for-websites/cards/overview/markup */
const X_REQUIRED = ["twitter:card"];
/** Site policy: a share card says what it shows and in which language. */
const POLICY_META = ["og:description", "og:image:alt", "og:locale"];
/** The Open Graph properties typed as arrays on https://ogp.me/#array and https://ogp.me/#type_article */
const REPEATABLE_META = new Set(["og:locale:alternate", "article:author", "article:tag"]);
/** Facebook's size for a link card: https://developers.facebook.com/docs/sharing/webmasters/images/ */
const CARD = { width: 1200, height: 630 };

const attribute = (name: string) => (element: Element) => element.getAttribute(name) ?? "";

function metaOf(document: Document): Record<string, string[]> {
  const meta: Record<string, string[]> = {};
  for (const element of document.querySelectorAll("meta[name], meta[property]")) {
    const name = element.getAttribute("name") ?? attribute("property")(element);
    (meta[name] ??= []).push(attribute("content")(element));
  }
  return meta;
}

function wordsInMain(document: Document): number {
  const main = document.querySelector("main")?.cloneNode(true) as Element | undefined;
  for (const hidden of main?.querySelectorAll("script, style") ?? []) hidden.remove();
  return (main?.textContent ?? "").split(/\s+/).filter(Boolean).length;
}

function crawlerView(status: number, document: Document) {
  const all = (selector: string) => [...document.querySelectorAll(selector)];
  const meta = metaOf(document);
  return {
    status,
    lang: document.documentElement.lang,
    titles: all("title").map(textOf),
    description: meta.description?.[0] ?? "",
    meta,
    canonicals: all('link[rel="canonical"]').map(attribute("href")),
    alternates: Object.fromEntries(
      all('link[rel="alternate"][hreflang]').map((link) => [
        attribute("hreflang")(link),
        attribute("href")(link)
      ])
    ),
    headings: all("h1").map(textOf),
    structuredData: all('script[type="application/ld+json"]').map((script) => script.textContent),
    links: [...new Set(all("a[href^='/']").map((link) => attribute("href")(link).split("#")[0]))],
    words: wordsInMain(document)
  };
}

type CrawledPage = ReturnType<typeof crawlerView>;

const pathOf = (url: string) => url.slice(SITE.origin.length) || "/";
/** The page's address in a language, worked out here rather than read off the page. */
const inLocale = (path: string, locale: string) => {
  const prefix = pathLocale(path);
  const unprefixed = prefix ? path.slice(prefix.length + 1) || "/" : path;
  if (locale === DEFAULT_LOCALE) return unprefixed;
  return unprefixed === "/" ? `/${locale}` : `/${locale}${unprefixed}`;
};
const localeOf = (path: string) => pathLocale(path) ?? DEFAULT_LOCALE;
const typesIn = (block: string) =>
  (JSON.parse(block) as { "@graph": { "@type": string }[] })["@graph"].map((node) => node["@type"]);

const XHTML = "http://www.w3.org/1999/xhtml";
const sitemap = await html("/sitemap.xml");
/** Parsed as XML, so a sitemap that is not well-formed throws here: https://www.sitemaps.org/protocol.html */
const sitemapDocument = new JSDOM(sitemap, { contentType: "application/xml" }).window.document;
/** The protocol's namespace: https://www.sitemaps.org/protocol.html#xmlTagDefinitions */
const SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9";
const sitemapUrls = [...sitemapDocument.getElementsByTagNameNS(SITEMAP_NAMESPACE, "url")].map(
  (url) => ({
    location: url.getElementsByTagNameNS(SITEMAP_NAMESPACE, "loc")[0]?.textContent ?? "",
    alternates: Object.fromEntries(
      [...url.getElementsByTagNameNS(XHTML, "link")]
        .filter((link) => link.getAttribute("rel") === "alternate")
        .map((link) => [attribute("hreflang")(link), attribute("href")(link)])
    )
  })
);
const paths = sitemapUrls.map(({ location }) => pathOf(location));
const pages = new Map<string, CrawledPage>();

beforeAll(async () => {
  for (const path of paths) {
    const response = await get(path);
    pages.set(path, crawlerView(response.status, new JSDOM(await response.text()).window.document));
  }
});

const crawled = (path: string) => pages.get(path)!;

test("robots.txt is the site's policy: every crawler may fetch everything, and the sitemap", async () => {
  const directives = (await html("/robots.txt")).split("\n").filter((line) => line.trim());
  // An absolute sitemap URL: https://www.sitemaps.org/protocol.html#submit_robots
  expect(directives).toEqual(["User-agent: *", "Allow: /", `Sitemap: ${SITE.origin}/sitemap.xml`]);
});

test("the sitemap lists the home page, the blog and every post, in every language", async () => {
  const posts = (await readdir(new URL("../../src/blog/posts/en/", import.meta.url))).map(
    (file) => `/blog/${file.replace(/\.md$/, "")}`
  );
  const expected = LOCALES.flatMap((locale) =>
    ["/", "/blog", ...posts].map((path) => inLocale(path, locale))
  );
  expect([...paths].sort()).toEqual(expected.sort());
  expect(sitemapDocument.documentElement.localName).toBe("urlset");
  expect(sitemapDocument.documentElement.namespaceURI).toBe(SITEMAP_NAMESPACE);
  // One host, absolute URLs: https://www.sitemaps.org/protocol.html#location
  for (const { location } of sitemapUrls) expect(location.startsWith(`${SITE.origin}/`)).toBe(true);
});

describe.for(paths)("%s", (path) => {
  test("has one title, and a title and description within the site's lengths", () => {
    const { titles, description } = crawled(path);
    // One title element: https://html.spec.whatwg.org/multipage/semantics.html#the-title-element
    expect(titles).toHaveLength(1);
    expect(titles[0]!.length).toBeGreaterThan(0);
    expect(titles[0]!.length).toBeLessThanOrEqual(POLICY.titleMax);
    expect(description.length).toBeGreaterThanOrEqual(POLICY.description.min);
    expect(description.length).toBeLessThanOrEqual(POLICY.description.max);
  });

  test("names each piece of metadata once", () => {
    const repeated = Object.entries(crawled(path).meta).filter(
      ([name, values]) => values.length > 1 && !REPEATABLE_META.has(name)
    );
    expect(repeated).toEqual([]);
  });

  test("is indexed as its own production URL, in its language, under one heading", () => {
    const page = crawled(path);
    expect(page.status).toBe(200);
    // One absolute canonical: https://www.rfc-editor.org/rfc/rfc6596#section-5
    expect(page.canonicals).toEqual([SITE.origin + path]);
    expect(page.meta.robots ?? []).not.toContainEqual(expect.stringContaining("noindex"));
    expect(page.lang).toBe(localeOf(path));
    // Site policy: Google accepts several h1, the site gives each page one.
    expect(page.headings).toHaveLength(1);
  });

  // Each version lists itself and every other, and each link is returned:
  // https://developers.google.com/search/docs/specialty/international/localized-versions#html
  test("names every language's version, itself too, and each names it back", () => {
    const { alternates, canonicals } = crawled(path);
    expect(alternates).toEqual(
      Object.fromEntries([
        ...LOCALES.map((locale) => [locale, SITE.origin + inLocale(path, locale)]),
        // Site policy: a visitor whose language the site does not have reads English.
        ["x-default", SITE.origin + inLocale(path, DEFAULT_LOCALE)]
      ])
    );
    expect(alternates[localeOf(path)]).toBe(canonicals[0]);
    for (const href of Object.values(alternates)) {
      const other = pages.get(pathOf(href));
      expect(other, `${href} is in the sitemap`).toBeDefined();
      expect(other!.alternates[localeOf(path)]).toBe(canonicals[0]);
    }
  });

  // The sitemap's alternates follow the same rules as the page's:
  // https://developers.google.com/search/docs/specialty/international/localized-versions#sitemap
  test("is listed in the sitemap with the same language versions as its page", () => {
    const listed = sitemapUrls.find(({ location }) => pathOf(location) === path)!;
    expect(listed.alternates).toEqual(crawled(path).alternates);
  });

  test("previews as a card of its own when shared", async () => {
    const { meta, canonicals } = crawled(path);
    for (const name of [...OPEN_GRAPH_REQUIRED, ...X_REQUIRED, ...POLICY_META]) {
      expect(meta[name]?.[0], name).toBeTruthy();
    }
    expect(meta["og:url"]![0]).toBe(canonicals[0]);

    const card = await get(pathOf(meta["og:image"]![0]!));
    expect(card.status).toBe(200);
    expect(card.headers.get("content-type")).toBe("image/png");
    expect(card.headers.get("cache-control")).toContain(POLICY.cardMaxAge);
    // Decoding checks the signature and every chunk's CRC: https://www.w3.org/TR/png-3/#5DataRep
    const { width, height } = decode(new Uint8Array(await card.arrayBuffer()), { checkCrc: true });
    const size = { width, height };
    expect(size).toEqual(CARD);
    // The image's structured properties describe it: https://ogp.me/#structured
    expect({
      type: meta["og:image:type"]?.[0],
      width: Number(meta["og:image:width"]?.[0]),
      height: Number(meta["og:image:height"]?.[0])
    }).toEqual({ type: "image/png", ...size });
  });
});

// Distinct titles and descriptions:
// https://developers.google.com/search/docs/appearance/title-link#page-titles and
// https://developers.google.com/search/docs/appearance/snippet#meta-descriptions
test("no two pages share a title or a description", () => {
  for (const field of ["titles", "description"] as const) {
    const values = [...pages.values()].map((page) => String(page[field]));
    expect(new Set(values).size, field).toBe(values.length);
  }
});

test("every link within the site leads straight to a page in the sitemap, or to a file, and a translated blog to its own posts", async () => {
  const linked = new Set([...pages.values()].flatMap((page) => page.links));
  for (const href of linked) {
    expect((await get(href)).status, href).toBe(200);
    const isFile = href.slice(href.lastIndexOf("/")).includes(".");
    expect(pages.has(href) || isFile, `${href} is in the sitemap`).toBe(true);
  }
  for (const locale of LOCALES.filter((locale) => locale !== DEFAULT_LOCALE)) {
    const posts = crawled(`/${locale}/blog`).links.filter((link) => link.includes("/blog/"));
    expect(posts.length, locale).toBeGreaterThan(0);
    expect(
      posts.filter((link) => !link.startsWith(`/${locale}/blog/`)),
      locale
    ).toEqual([]);
  }
});

test("what crawlers read of each page is what it was", async () => {
  const snapshot = Object.fromEntries(
    [...pages].map(([path, page]) => [
      path,
      {
        title: page.titles[0],
        description: page.description,
        h1: page.headings[0] ?? null,
        canonical: page.canonicals[0] ?? null,
        card: pathOf(page.meta["og:image"]?.[0] ?? ""),
        structuredData: page.structuredData.flatMap(typesIn).sort().join(", "),
        words: page.words,
        links: page.links.length
      }
    ])
  );
  await expect(`${JSON.stringify(snapshot, null, 2)}\n`).toMatchFileSnapshot(
    "__snapshots__/crawl.json"
  );
});
