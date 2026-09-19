import { decode } from "fast-png";
import { describe, expect, test } from "vitest";
import { BlogCard, CARD_HEIGHT, CARD_WIDTH, HomeCard, PostCard } from "#app/server/og/Card";
import { readCard, renderCard, toHtml } from "#app/server/og/cards";

const post = {
  slug: "back-to-java",
  title: "Back to Java <3",
  author: "phinner",
  topic: "Toxopid & friends",
  publishedAt: "2026-07-20T00:00:00.000Z",
};

describe("card markup", () => {
  test("a post card carries its frontmatter, escaped", () => {
    const html = toHtml(() => <PostCard post={post} />);
    expect(html).toContain("Back to Java &lt;3");
    expect(html).toContain("Toxopid &amp; friends");
    expect(html).toContain("20 Jul 2026");
    expect(html).toContain(">back-to-java<");
    expect(html).not.toContain("<!--");
  });

  test("the home card drops the GitHub counts when there are none", () => {
    expect(toHtml(() => <HomeCard github={{ stars: 73, forks: 30 }} />)).toContain("Stars");
    expect(toHtml(() => <HomeCard github={undefined} />)).not.toContain("Stars");
    expect(toHtml(() => <HomeCard github={undefined} />)).toContain("Projects");
  });

  test("the blog card survives an empty blog", () => {
    expect(toHtml(() => <BlogCard posts={[]} />)).toContain("Posts");
    expect(toHtml(() => <BlogCard posts={[post]} />)).toContain("20 Jul 2026");
  });
});

describe("card rendering", () => {
  test("produces a PNG at the social card size", async () => {
    const png = decode(await renderCard(() => <PostCard post={post} />));
    expect([png.width, png.height]).toEqual([CARD_WIDTH, CARD_HEIGHT]);
  });

  test("answers only the paths the pages point at", async () => {
    expect(await readCard("blog/no-such-post.png")).toBeUndefined();
    expect(await readCard("home")).toBeUndefined();
    expect(await readCard("../home.png")).toBeUndefined();
  });

  test("renders a path once and shares the result", async () => {
    const [first, second] = await Promise.all([readCard("blog.png"), readCard("blog.png")]);
    expect(first).toBeDefined();
    expect(second).toBe(first);
    expect(await readCard("blog.png")).toBe(first);
  });
});
