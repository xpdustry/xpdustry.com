import { describe, expect, test } from "vitest";
import { posts, postsBySlug } from "#app/content/registry";
import { projects } from "#app/data/projects";
import { parseReleaseId } from "#app/lib/releases";

describe("blog registry", () => {
  test("orders posts newest first", () => {
    const dates = posts.map((post) => Date.parse(post.frontmatter.publishedAt));
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });

  test("indexes every post by its slug", () => {
    expect(postsBySlug.size).toBe(posts.length);
    for (const post of posts) expect(postsBySlug.get(post.slug)).toBe(post);
  });

  test("points every release id at a repository the site knows about", () => {
    const known = new Set(projects.map((project) => project.repository));
    for (const post of posts) {
      for (const id of post.frontmatter.releases ?? []) {
        const parsed = parseReleaseId(id);
        if (!parsed) throw new Error(`${post.slug} has an invalid release id: ${id}`);
        expect(known).toContain(parsed.repository);
      }
    }
  });
});
