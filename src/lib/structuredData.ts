import { authors } from "#app/content/authors";
import type { Post } from "#app/content/registry";
import { SITE } from "#app/data/site";
import { postCard, postTitle } from "#app/lib/seo";

type JsonValue = string | number | boolean | null | JsonValue[] | JsonLd;
export interface JsonLd {
  [key: string]: JsonValue;
}

const CONTEXT = "https://schema.org";
const ORGANIZATION_ID = `${SITE.origin}/#organization`;

export function homeStructuredData(): JsonLd {
  return {
    "@context": CONTEXT,
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE.origin}/#website`,
        name: SITE.name,
        url: `${SITE.origin}/`,
        publisher: { "@id": ORGANIZATION_ID },
      },
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: SITE.name,
        url: `${SITE.origin}/`,
        logo: `${SITE.origin}/icon-512.png`,
        email: SITE.email,
        sameAs: [SITE.github, SITE.discord],
      },
    ],
  };
}

export function postStructuredData(post: Pick<Post, "slug" | "frontmatter">): JsonLd {
  const { description, author, publishedAt, updatedAt } = post.frontmatter;
  const title = postTitle(post.frontmatter);
  const url = `${SITE.origin}/blog/${post.slug}`;
  return {
    "@context": CONTEXT,
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#post`,
        headline: title,
        description,
        datePublished: publishedAt,
        ...(updatedAt ? { dateModified: updatedAt } : {}),
        image: `${SITE.origin}${postCard(post.slug, title).url}`,
        author: { "@type": "Person", name: author, url: authors[author].url },
        publisher: { "@id": ORGANIZATION_ID },
        mainEntityOfPage: url,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE.origin}/` },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE.origin}/blog` },
          { "@type": "ListItem", position: 3, name: title, item: url },
        ],
      },
    ],
  };
}
