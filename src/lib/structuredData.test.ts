import { expect, test } from "vitest";
import { authors } from "#app/content/authors";
import { SITE } from "#app/data/site";
import { homeStructuredData, postStructuredData } from "#app/lib/structuredData";

const post = {
  slug: "release",
  frontmatter: {
    title: "Beta 11",
    topic: "NoHorny",
    topicVersion: "4",
    description: "An update",
    author: "phinner",
    publishedAt: "2026-10-07T00:00:00.000Z",
  },
} as const;

test("identifies the website and organization from published site data", () => {
  expect(homeStructuredData()).toEqual({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE.origin}/#website`,
        name: SITE.name,
        url: `${SITE.origin}/`,
        publisher: { "@id": `${SITE.origin}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${SITE.origin}/#organization`,
        name: SITE.name,
        url: `${SITE.origin}/`,
        logo: `${SITE.origin}/icon-512.png`,
        email: SITE.email,
        sameAs: [SITE.github, SITE.discord],
      },
    ],
  });
});

test("publishes the post's author, dates, card, publisher and breadcrumb trail", () => {
  const result = postStructuredData(post);
  expect(result).toMatchObject({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: "NoHorny 4 Beta 11",
        description: post.frontmatter.description,
        datePublished: post.frontmatter.publishedAt,
        image: `${SITE.origin}/og/blog/release.png`,
        author: { "@type": "Person", name: "phinner", url: authors.phinner.url },
        publisher: { "@id": `${SITE.origin}/#organization` },
        mainEntityOfPage: `${SITE.origin}/blog/release`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { position: 1, name: "Home", item: `${SITE.origin}/` },
          { position: 2, name: "Blog", item: `${SITE.origin}/blog` },
          { position: 3, name: "NoHorny 4 Beta 11", item: `${SITE.origin}/blog/release` },
        ],
      },
    ],
  });
  expect(JSON.stringify(result)).not.toContain("dateModified");
  expect(
    JSON.stringify(
      postStructuredData({
        ...post,
        frontmatter: {
          ...post.frontmatter,
          updatedAt: "2026-10-08T00:00:00.000Z",
        },
      }),
    ),
  ).toContain('"dateModified":"2026-10-08T00:00:00.000Z"');
});
