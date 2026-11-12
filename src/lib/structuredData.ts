import { msg } from "gt-tanstack-start";
import { authors } from "#app/blog/content/authors";
import type { Post } from "#app/blog/content/registry";
import { SITE } from "#app/brand/site";
import { withLocale } from "#app/i18n/localePath";
import { DEFAULT_LOCALE } from "#app/i18n/locales";
import { postCard, postTitle, type Translate } from "#app/lib/seo";

type JsonValue = string | number | boolean | null | JsonValue[] | JsonLd;
export interface JsonLd {
  [key: string]: JsonValue;
}

const CONTEXT = "https://schema.org";
const ORGANIZATION_ID = `${SITE.origin}/#organization`;
const CRUMB = { home: msg("Home"), blog: msg("Blog") };

export function homeStructuredData(locale: string = DEFAULT_LOCALE): JsonLd {
  const home = `${SITE.origin}${withLocale("/", locale)}`;
  return {
    "@context": CONTEXT,
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE.origin}/#website`,
        name: SITE.name,
        url: home,
        inLanguage: locale,
        publisher: { "@id": ORGANIZATION_ID }
      },
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: SITE.name,
        url: `${SITE.origin}/`,
        logo: `${SITE.origin}/icon-512.png`,
        email: SITE.email,
        sameAs: [SITE.github, SITE.discord]
      }
    ]
  };
}

export function postStructuredData(
  post: Pick<Post, "slug" | "frontmatter">,
  locale: string,
  m: Translate
): JsonLd {
  const at = (path: string) => `${SITE.origin}${withLocale(path, locale)}`;
  const { description, author, publishedAt, updatedAt } = post.frontmatter;
  const title = postTitle(post.frontmatter);
  const url = at(`/blog/${post.slug}`);
  return {
    "@context": CONTEXT,
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#post`,
        headline: title,
        description,
        inLanguage: locale,
        datePublished: publishedAt,
        ...(updatedAt ? { dateModified: updatedAt } : {}),
        image: `${SITE.origin}${postCard(post.slug, title).url}`,
        author: { "@type": "Person", name: author, url: authors[author].url },
        publisher: { "@id": ORGANIZATION_ID },
        mainEntityOfPage: url
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: m(CRUMB.home), item: at("/") },
          { "@type": "ListItem", position: 2, name: m(CRUMB.blog), item: at("/blog") },
          { "@type": "ListItem", position: 3, name: title, item: url }
        ]
      }
    ]
  };
}
