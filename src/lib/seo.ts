import type { BlogFrontmatter } from "#app/blog/content/schema";
import { BLOG_TITLE } from "#app/blog/titles";
import { SITE } from "#app/brand/site";
import { withLocale } from "#app/i18n/localePath";
import { DEFAULT_LOCALE, LOCALES, localeInfo } from "#app/i18n/locales";
import type { JsonLd } from "#app/lib/structuredData";

export interface PageImage {
  /** Site-relative, e.g. `/og/home.png`. */
  url: string;
  alt: string;
}

export const CARD_SIZE = { width: 1200, height: 630 } as const;

/** Looks up a `msg()` string in the language of the request. */
export type Translate = (message: string) => string;

export function siteCard(m: Translate): PageImage {
  return { url: "/og/home.png", alt: `${SITE.name} - ${m(SITE.positioning)}` };
}

export function blogCard(m: Translate): PageImage {
  return { url: "/og/blog.png", alt: m(BLOG_TITLE) };
}

export function postCard(slug: string, title: string): PageImage {
  return { url: `/og/blog/${slug}.png`, alt: `${title} - ${SITE.name}` };
}

export function postTitle({
  title,
  topic,
  topicVersion
}: Pick<BlogFrontmatter, "title" | "topic" | "topicVersion">): string {
  if (title.toLowerCase().includes(topic.toLowerCase())) return title;
  return `${topic}${topicVersion ? ` ${topicVersion}` : ""} ${title}`;
}

export interface PageSeo {
  title: string;
  /** Use the title as written, without appending the site name. */
  fullTitle?: boolean;
  description: string;
  /** Site-relative and without a locale, e.g. `/blog`. */
  path: string;
  /** The locale the page is rendered in; the default one when absent. */
  locale?: string;
  type?: "website" | "article";
  image: PageImage;
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
  const locale = page.locale ?? DEFAULT_LOCALE;
  const urlIn = (other: string) => `${SITE.origin}${withLocale(page.path, other)}`;
  const url = urlIn(locale);
  const imageUrl = `${SITE.origin}${withLocale(page.image.url, locale)}`;

  return {
    meta: [
      { title },
      { name: "description", content: page.description },
      { property: "og:type", content: page.type ?? "website" },
      { property: "og:site_name", content: SITE.name },
      { property: "og:locale", content: localeInfo(locale).openGraph },
      ...LOCALES.filter((other) => other !== locale).map((other) => ({
        property: "og:locale:alternate",
        content: localeInfo(other).openGraph
      })),
      { property: "og:title", content: title },
      { property: "og:description", content: page.description },
      { property: "og:url", content: url },
      { property: "og:image", content: imageUrl },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: String(CARD_SIZE.width) },
      { property: "og:image:height", content: String(CARD_SIZE.height) },
      { property: "og:image:alt", content: page.image.alt },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: page.description },
      { name: "twitter:image", content: imageUrl },
      { name: "twitter:image:alt", content: page.image.alt },
      ...(page.publishedAt
        ? [{ property: "article:published_time", content: page.publishedAt }]
        : []),
      ...(page.updatedAt ? [{ property: "article:modified_time", content: page.updatedAt }] : []),
      ...(page.authorUrl ? [{ property: "article:author", content: page.authorUrl }] : [])
    ],
    links: [
      { rel: "canonical", href: url },
      ...LOCALES.map((other) => ({ rel: "alternate", hrefLang: other, href: urlIn(other) })),
      { rel: "alternate", hrefLang: "x-default", href: urlIn(DEFAULT_LOCALE) }
    ],
    scripts: page.jsonLd
      ? [
          {
            type: "application/ld+json",
            children: JSON.stringify(page.jsonLd).replace(/</g, "\\u003c")
          }
        ]
      : []
  };
}
