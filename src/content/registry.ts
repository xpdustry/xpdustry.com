// Every post's frontmatter is loaded eagerly, so listings need no I/O and the build validates them
// all. A post's body is only loaded by the page that shows it.

import type { MarkdownDocument } from "@tanstack/markdown";
import { ContentError } from "#app/content/errors";
import type { BlogFrontmatter } from "#app/content/schema";

/** What `vite/markdown.ts` compiles a post into. */
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

const frontmatters = import.meta.glob<BlogFrontmatter>("./blog/*.md", {
  query: "?frontmatter",
  import: "frontmatter",
  eager: true,
});
const documents = import.meta.glob<MarkdownDocument>("./blog/*.md", { import: "document" });

/** Newest first. */
export const posts: readonly Post[] = buildPosts();
export const postsBySlug: ReadonlyMap<string, Post> = new Map(
  posts.map((post) => [post.slug, post]),
);

assertReleasesAreClaimedOnce();

function buildPosts(): Post[] {
  return Object.entries(frontmatters)
    .map(([file, frontmatter]) => ({
      slug: file.replace(/^.*\//, "").replace(/\.md$/, ""),
      frontmatter,
      load: documents[file]!,
    }))
    .sort((a, b) => Date.parse(b.frontmatter.publishedAt) - Date.parse(a.frontmatter.publishedAt));
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
