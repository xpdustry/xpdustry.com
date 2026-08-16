/**
 * The blog and docs registries, built from the MDX in this directory.
 *
 * `import.meta.glob` is eager because the whole corpus is nine short files:
 * an index page needs every post's frontmatter anyway, and lazily loading
 * five modules to list five titles costs more than it saves.
 *
 * Every invariant is checked at module evaluation, so a bad date or a
 * duplicate slug fails the build rather than rendering a broken page.
 */

import type { Component } from "solid-js";
import {
  ContentError,
  parseBlogFrontmatter,
  parseDocFrontmatter,
  type BlogFrontmatter,
  type DocFrontmatter,
} from "#app/content/schema";
import type { DocHeading } from "#build/rehype-heading-anchors";

interface MdxModule {
  default: Component<Record<string, unknown>>;
  frontmatter?: unknown;
  headings?: DocHeading[];
}

export interface BlogPost {
  slug: string;
  frontmatter: BlogFrontmatter;
  headings: DocHeading[];
  Content: Component<Record<string, unknown>>;
}

export interface DocPage {
  /** Route path, e.g. `/projects/nohorny/install`. */
  path: string;
  project: string;
  slug: string;
  frontmatter: DocFrontmatter;
  headings: DocHeading[];
  Content: Component<Record<string, unknown>>;
}

const blogModules = import.meta.glob<MdxModule>("./blog/*.mdx", {
  eager: true,
});
const docModules = import.meta.glob<MdxModule>("./projects/*/*.mdx", {
  eager: true,
});

export const posts: readonly BlogPost[] = buildPosts();
export const postsBySlug: ReadonlyMap<string, BlogPost> = new Map(
  posts.map((post) => [post.slug, post]),
);

export const docs: readonly DocPage[] = buildDocs();
export const docsByPath: ReadonlyMap<string, DocPage> = new Map(docs.map((doc) => [doc.path, doc]));

// Content invariant, checked at module evaluation like the rest of them.
assertReleasesAreClaimedOnce();

export function docsForProject(project: string): readonly DocPage[] {
  return docs.filter((doc) => doc.project === project);
}

function buildPosts(): BlogPost[] {
  const seen = new Set<string>();
  const built: BlogPost[] = [];

  for (const [file, module] of Object.entries(blogModules)) {
    const slug = fileSlug(file);
    if (seen.has(slug)) throw new ContentError(file, `duplicate post slug ${slug}`);
    seen.add(slug);

    const frontmatter = parseBlogFrontmatter(file, module.frontmatter);

    built.push({
      slug,
      frontmatter,
      headings: module.headings ?? [],
      Content: module.default,
    });
  }

  // Newest first, everywhere the list is used.
  return built.sort(
    (a, b) => Date.parse(b.frontmatter.publishedAt) - Date.parse(a.frontmatter.publishedAt),
  );
}

function buildDocs(): DocPage[] {
  const built: DocPage[] = [];

  for (const [file, module] of Object.entries(docModules)) {
    const match = /^\.\/projects\/([^/]+)\/([^/]+)\.mdx$/.exec(file);
    if (!match)
      throw new ContentError(file, "project pages live at content/projects/<project>/<slug>.mdx");
    const [, project, name] = match;
    const slug = name === "index" ? "" : name;

    built.push({
      path: slug === "" ? `/projects/${project}` : `/projects/${project}/${slug}`,
      project,
      slug,
      frontmatter: parseDocFrontmatter(file, module.frontmatter),
      headings: module.headings ?? [],
      Content: module.default,
    });
  }

  const paths = new Set<string>();
  for (const doc of built) {
    if (paths.has(doc.path)) throw new ContentError(doc.path, "duplicate docs path");
    paths.add(doc.path);
  }

  return built.sort((a, b) => a.frontmatter.order - b.frontmatter.order);
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
  return file.replace(/^.*\//, "").replace(/\.mdx$/, "");
}
