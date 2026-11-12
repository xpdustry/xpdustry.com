import type { BlogFrontmatter } from "#app/content/schema";
import { BLOG_DESCRIPTION, SITE } from "#app/data/site";
import type { JsonLd } from "#app/lib/structuredData";

export interface PageImage {
  /** Site-relative, e.g. `/og/home.png`. */
  url: string;
  alt: string;
}

/** Social cards are rendered by `routes/og/$.ts` at this size. */
export const CARD_SIZE = { width: 1200, height: 630 } as const;

/** The shared card, for every page without one of its own. */
export const SITE_CARD: PageImage = {
  url: "/og/home.png",
  alt: `${SITE.name} - ${SITE.positioning}`,
};

export const BLOG_CARD: PageImage = {
  url: "/og/blog.png",
  alt: `${SITE.name} blog - ${BLOG_DESCRIPTION}`,
};

export function postCard(slug: string, title: string): PageImage {
  return { url: `/og/blog/${slug}.png`, alt: `${title} - ${SITE.name}` };
}

export function postTitle({
  title,
  topic,
  topicVersion,
}: Pick<BlogFrontmatter, "title" | "topic" | "topicVersion">): string {
  if (title.toLowerCase().includes(topic.toLowerCase())) return title;
  return `${topic}${topicVersion ? ` ${topicVersion}` : ""} ${title}`;
}

export interface PageSeo {
  title: string;
  /** Use the title as written, without appending the site name. */
  fullTitle?: boolean;
  description: string;
  /** Site-relative, e.g. `/blog`. */
  path: string;
  type?: "website" | "article";
  image?: PageImage;
  publishedAt?: string;
  updatedAt?: string;
  /** Profile URL of the author, for `article:author`. */
  authorUrl?: string;
  jsonLd?: JsonLd;
}

/** A route's `head()`: title, description, canonical URL, Open Graph and Twitter tags. */
export function seo(page: PageSeo) {
  const title =
    page.fullTitle || page.title === SITE.name ? page.title : `${page.title} - ${SITE.name}`;
  const url = `${SITE.origin}${page.path}`;
  const image = page.image ?? SITE_CARD;
  const imageUrl = `${SITE.origin}${image.url}`;

  return {
    meta: [
      { title },
      { name: "description", content: page.description },
      { property: "og:type", content: page.type ?? "website" },
      { property: "og:site_name", content: SITE.name },
      { property: "og:locale", content: "en_US" },
      { property: "og:title", content: title },
      { property: "og:description", content: page.description },
      { property: "og:url", content: url },
      { property: "og:image", content: imageUrl },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: String(CARD_SIZE.width) },
      { property: "og:image:height", content: String(CARD_SIZE.height) },
      { property: "og:image:alt", content: image.alt },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: page.description },
      { name: "twitter:image", content: imageUrl },
      { name: "twitter:image:alt", content: image.alt },
      ...(page.publishedAt
        ? [{ property: "article:published_time", content: page.publishedAt }]
        : []),
      ...(page.updatedAt ? [{ property: "article:modified_time", content: page.updatedAt }] : []),
      ...(page.authorUrl ? [{ property: "article:author", content: page.authorUrl }] : []),
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: page.jsonLd
      ? [
          {
            type: "application/ld+json",
            children: JSON.stringify(page.jsonLd).replace(/</g, "\\u003c"),
          },
        ]
      : [],
  };
}
