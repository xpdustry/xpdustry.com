import { createFileRoute } from "@tanstack/react-router";
import { posts } from "#app/content/registry";
import { SITE } from "#app/data/site";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const pages = [
          { path: "/" },
          { path: "/blog", lastmod: posts[0]?.frontmatter.publishedAt },
          ...posts.map((post) => ({
            path: `/blog/${post.slug}`,
            lastmod: post.frontmatter.updatedAt ?? post.frontmatter.publishedAt,
          })),
        ];
        const urls = pages.map(
          ({ path, lastmod }) =>
            `  <url><loc>${SITE.origin}${path}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ""}</url>`,
        );
        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...urls,
          "</urlset>",
          "",
        ].join("\n");
        return new Response(xml, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
