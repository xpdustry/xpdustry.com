import type { MarkdownDocument } from "@tanstack/markdown";
import { ContentError } from "#app/content/errors";
import type { BlogFrontmatter } from "#app/content/schema";
import { DEFAULT_LOCALE } from "#app/i18n/locales";

export interface PostModule {
  frontmatter: BlogFrontmatter;
  document: MarkdownDocument;
}

export interface Post {
  slug: string;
  frontmatter: BlogFrontmatter;
  /** The post's body, in its own chunk. */
  load: () => Promise<MarkdownDocument>;
}

const frontmatters = import.meta.glob<BlogFrontmatter>("./blog/*/*.md", {
  query: "?frontmatter",
  import: "frontmatter",
  eager: true,
});
const documents = import.meta.glob<MarkdownDocument>("./blog/*/*.md", { import: "document" });

const byLocale = buildPosts();

/** Newest first, in the default locale. */
export const posts: readonly Post[] = [...(byLocale.get(DEFAULT_LOCALE)?.values() ?? [])].sort(
  (a, b) => Date.parse(b.frontmatter.publishedAt) - Date.parse(a.frontmatter.publishedAt),
);
export const postsBySlug: ReadonlyMap<string, Post> = new Map(
  posts.map((post) => [post.slug, post]),
);

assertReleasesAreClaimedOnce();

function buildPosts(): Map<string, Map<string, Post>> {
  const byLocale = new Map<string, Map<string, Post>>();
  for (const [file, frontmatter] of Object.entries(frontmatters)) {
    const [, locale, slug] = /\/([^/]+)\/([^/]+)\.md$/.exec(file)!;
    if (!byLocale.has(locale!)) byLocale.set(locale!, new Map());
    byLocale.get(locale!)!.set(slug!, { slug: slug!, frontmatter, load: documents[file]! });
  }
  return byLocale;
}

/** `post` as `locale` reads it: its translation, or the post itself where there is none. */
export function translated(post: Post, locale: string): Post {
  return byLocale.get(locale)?.get(post.slug) ?? post;
}

function assertReleasesAreClaimedOnce(): void {
  const claimedBy = new Map<string, string>();
  for (const post of posts) {
    for (const id of post.frontmatter.releases ?? []) {
      const existing = claimedBy.get(id);
      if (existing) {
        throw new ContentError(post.slug, `release ${id} is already claimed by ${existing}`);
      }
      claimedBy.set(id, post.slug);
    }
  }
}

/** The `count` posts published closest to `slug`, newer ones winning ties, newest first. */
export function nearbyPosts(slug: string, count = 3): Post[] {
  const index = posts.findIndex((post) => post.slug === slug);
  return posts
    .map((post, at) => ({ post, at, distance: Math.abs(at - index) }))
    .filter((entry) => entry.at !== index)
    .sort((a, b) => a.distance - b.distance || a.at - b.at)
    .slice(0, count)
    .sort((a, b) => a.at - b.at)
    .map((entry) => entry.post);
}
