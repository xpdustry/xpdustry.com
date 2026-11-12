import { createFileRoute } from "@tanstack/react-router";
import { posts } from "#app/blog/content/registry";
import { SITE } from "#app/brand/site";
import { withLocale } from "#app/i18n/localePath";
import { DEFAULT_LOCALE, LOCALES } from "#app/i18n/locales";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () =>
        new Response(sitemap(), {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600"
          }
        })
    }
  }
});

interface Page {
  path: string;
  lastmod?: string;
}

function pages(): Page[] {
  return [
    { path: "/" },
    { path: "/blog", lastmod: posts[0]?.frontmatter.publishedAt },
    ...posts.map((post) => ({
      path: `/blog/${post.slug}`,
      lastmod: post.frontmatter.updatedAt ?? post.frontmatter.publishedAt
    }))
  ];
}

function sitemap(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...pages().flatMap(entries),
    "</urlset>",
    ""
  ].join("\n");
}

const at = (path: string, locale: string) => `${SITE.origin}${withLocale(path, locale)}`;

/** One entry per language, each listing the page in every language. */
function entries({ path, lastmod }: Page): string[] {
  const alternates = [
    ...LOCALES.map(
      (locale) => `<xhtml:link rel="alternate" hreflang="${locale}" href="${at(path, locale)}"/>`
    ),
    `<xhtml:link rel="alternate" hreflang="x-default" href="${at(path, DEFAULT_LOCALE)}"/>`
  ].join("");
  const modified = lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : "";
  return LOCALES.map(
    (locale) => `  <url><loc>${at(path, locale)}</loc>${modified}${alternates}</url>`
  );
}
