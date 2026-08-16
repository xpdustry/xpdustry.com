/**
 * Checks the real corpus rather than a fixture: the registry's job is to fail
 * the build when the content in this repository is wrong, so the content in
 * this repository is what the tests should assert against.
 */

import { describe, expect, test } from "vitest";
import { docs, docsByPath, docsForProject, posts, postsBySlug } from "#app/content/registry";
import { overviewPath, projects, projectsBySlug, projectUrl } from "#app/data/projects";
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

describe("docs registry", () => {
  test("exposes the NoHorny pages at their route paths", () => {
    expect(docsByPath.has("/projects/nohorny")).toBe(true);
    expect(docsByPath.has("/projects/nohorny/install")).toBe(true);
    expect(docsByPath.has("/projects/nohorny/settings")).toBe(true);
    expect(docsByPath.has("/projects/nohorny/server")).toBe(true);
    expect(docsByPath.has("/projects/nohorny/errors")).toBe(true);
  });

  test("sorts a project section by frontmatter order", () => {
    const orders = docsForProject("nohorny").map((doc) => doc.frontmatter.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    expect(docsForProject("nohorny")[0].frontmatter.title).toBe("NoHorny");
  });

  test("returns an empty section for a project with no pages", () => {
    expect(docsForProject("toxopid")).toEqual([]);
  });

  test("extracts headings for the on-this-page rail", () => {
    const install = docsByPath.get("/projects/nohorny/install")!;
    expect(install.headings.length).toBeGreaterThan(1);
    for (const heading of install.headings) {
      expect(heading.id).not.toBe("");
      expect(heading.text).not.toBe("");
      expect([2, 3]).toContain(heading.depth);
    }
  });

  test("gives every heading in a page a unique id", () => {
    for (const doc of docs) {
      const ids = doc.headings.map((heading) => heading.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  // A project marked hosted with no pages behind it is a card pointing at a
  // 404; one with pages and no mark is content nothing links to.
  test("a project is hosted exactly when it has pages", () => {
    for (const project of projects) {
      const hasPages = docsForProject(project.slug).length > 0;
      expect(Boolean(project.hosted), project.slug).toBe(hasPages);
      expect(overviewPath(project), project.slug).toBe(
        hasPages ? `/projects/${project.slug}` : undefined,
      );
    }
  });

  test("a project card points at its pages, or at GitHub when it has none", () => {
    expect(projectUrl(projectsBySlug.get("nohorny")!)).toBe("/projects/nohorny");
    expect(projectUrl(projectsBySlug.get("claj")!)).toBe("https://github.com/xpdustry/claj");
  });
});
