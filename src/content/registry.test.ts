/**
 * Checks the real corpus rather than a fixture: the registry's job is to fail
 * the build when the content in this repository is wrong, so the content in
 * this repository is what the tests should assert against.
 */

import { describe, expect, test } from "vitest";
import { posts, postsBySlug } from "#app/content/registry";
import { projects } from "#app/data/projects";
import { parseReleaseId } from "#app/lib/releases";

describe("blog registry", () => {
  test("holds the four migrated posts", () => {
    expect(posts.map((post) => post.slug).sort()).toEqual([
      "nohorny-4-beta-1",
      "nohorny-4-beta-3",
      "nohorny-4-beta-7",
      "nohorny-4-beta-8",
    ]);
  });

  test("orders posts newest first", () => {
    const dates = posts.map((post) => Date.parse(post.frontmatter.publishedAt));
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });

  test("indexes every post by its slug", () => {
    expect(postsBySlug.size).toBe(posts.length);
    for (const post of posts) expect(postsBySlug.get(post.slug)).toBe(post);
  });

  test("gives every post a title, description and author", () => {
    for (const post of posts) {
      expect(post.frontmatter.title).not.toBe("");
      expect(post.frontmatter.description).not.toBe("");
      expect(post.frontmatter.author).not.toBe("");
    }
  });

  test("points every release id at a repository the site knows about", () => {
    const known = new Set(projects.map((project) => project.repository));
    for (const post of posts) {
      for (const id of post.frontmatter.releases ?? []) {
        const parsed = parseReleaseId(id);
        expect(parsed, `${post.slug} has an unparseable release id ${id}`).toBeDefined();
        expect(known).toContain(parsed!.repository);
      }
    }
  });

  test("never lets two posts claim the same release", () => {
    const claimedBy = new Map<string, string>();
    for (const post of posts) {
      for (const id of post.frontmatter.releases ?? []) {
        expect(claimedBy.has(id), `${id} is claimed by ${claimedBy.get(id)} as well`).toBe(false);
        claimedBy.set(id, post.slug);
      }
    }
  });
});
