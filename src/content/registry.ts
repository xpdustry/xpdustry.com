// Eager loading validates every post during the build.

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

  return built.sort(
    (a, b) => Date.parse(b.frontmatter.publishedAt) - Date.parse(a.frontmatter.publishedAt),
  );
}

function fileSlug(file: string): string {
  return file.replace(/^.*\//, "").replace(/\.md$/, "");
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
