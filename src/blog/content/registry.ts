import type { MarkdownDocument } from "@tanstack/markdown";
import { DEFAULT_LOCALE } from "#app/i18n/locales";
import { ContentError } from "./errors";
import type { BlogFrontmatter } from "./schema";

export interface PostModule {
  frontmatter: BlogFrontmatter;
  document: MarkdownDocument;
}

export interface Post {
  slug: string;
  frontmatter: BlogFrontmatter;
  load: () => Promise<MarkdownDocument>;
}

const frontmatters = import.meta.glob<BlogFrontmatter>("../posts/*/*.md", {
  query: "?frontmatter",
  import: "frontmatter",
  eager: true
});
const documents = import.meta.glob<MarkdownDocument>("../posts/*/*.md", { import: "document" });

const byLocale = buildPosts();

export const posts: readonly Post[] = [...(byLocale.get(DEFAULT_LOCALE)?.values() ?? [])].sort(
  (a, b) => Date.parse(b.frontmatter.publishedAt) - Date.parse(a.frontmatter.publishedAt)
);
export const postsBySlug: ReadonlyMap<string, Post> = new Map(
  posts.map((post) => [post.slug, post])
);

assertReleasesAreClaimedOnce(posts);

function buildPosts(): Map<string, Map<string, Post>> {
  const byLocale = new Map<string, Map<string, Post>>();
  for (const [file, frontmatter] of Object.entries(frontmatters)) {
    const [, locale, slug] = /\/([^/]+)\/([^/]+)\.md$/.exec(file)!;
    if (!byLocale.has(locale!)) byLocale.set(locale!, new Map());
    byLocale.get(locale!)!.set(slug!, { slug: slug!, frontmatter, load: documents[file]! });
  }
  return byLocale;
}

export function translated(post: Post, locale: string): Post {
  return byLocale.get(locale)?.get(post.slug) ?? post;
}

export function assertReleasesAreClaimedOnce(posts: readonly Post[]): void {
  const claimedBy = new Map<string, string>();
  const claims = posts.flatMap((post) =>
    (post.frontmatter.releases ?? []).map((id) => ({ id, slug: post.slug }))
  );
  for (const { id, slug } of claims) {
    const existing = claimedBy.get(id);
    if (existing) throw new ContentError(slug, `release ${id} is already claimed by ${existing}`);
    claimedBy.set(id, slug);
  }
}

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
