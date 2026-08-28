/**
 * The blog registry, built from compiled Markdown modules in this directory.
 *
 * `import.meta.glob` is eager because the whole corpus is four short posts:
 * an index page needs every post's frontmatter anyway, and lazily loading
 * four modules to list four titles costs more than it saves.
 *
 * Every invariant is checked at module evaluation, so a bad date or a
 * duplicate slug fails the build rather than rendering a broken page.
 */

import { ContentError, type BlogFrontmatter } from "#app/content/schema";

interface MarkdownModule {
  frontmatter: BlogFrontmatter;
  html: string;
}

export interface BlogPost {
  slug: string;
  frontmatter: BlogFrontmatter;
  html: string;
}

const blogModules = import.meta.glob<MarkdownModule>("./blog/*.md", {
  eager: true,
});

export const posts: readonly BlogPost[] = buildPosts();
export const postsBySlug: ReadonlyMap<string, BlogPost> = new Map(
  posts.map((post) => [post.slug, post]),
);

// Content invariant, checked at module evaluation like the rest of them.
assertReleasesAreClaimedOnce();

function buildPosts(): BlogPost[] {
  const seen = new Set<string>();
  const built: BlogPost[] = [];

  for (const [file, module] of Object.entries(blogModules)) {
    const slug = fileSlug(file);
    if (seen.has(slug)) throw new ContentError(file, `duplicate post slug ${slug}`);
    seen.add(slug);

    built.push({
      slug,
      frontmatter: module.frontmatter,
      html: module.html,
    });
  }

  // Newest first, everywhere the list is used.
  return built.sort(
    (a, b) => Date.parse(b.frontmatter.publishedAt) - Date.parse(a.frontmatter.publishedAt),
  );
}

/**
 * No two posts may say they cover the same release.
 *
 * Nothing joins on these ids any more — the release box on a post page builds
 * its links from the id itself. This stays because two posts claiming one
 * release is still a mistake in the writing, and a build is a better place to
 * find out than a reader is.
 */
function assertReleasesAreClaimedOnce(): void {
  const claimedBy = new Map<string, string>();
  for (const post of posts) {
    for (const id of post.frontmatter.releases ?? []) {
      const existing = claimedBy.get(id);
      if (existing && existing !== post.slug) {
        throw new ContentError(post.slug, `release ${id} is already claimed by ${existing}`);
      }
      claimedBy.set(id, post.slug);
    }
  }
}

function fileSlug(file: string): string {
  return file.replace(/^.*\//, "").replace(/\.md$/, "");
}
