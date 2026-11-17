import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { PostBody } from "../PostBody";
import { blogMarkdownPlugin, compileBlogMarkdown } from "./markdown";

const frontmatter = `---
title: A post
description: A useful description.
publishedAt: 2026-08-28
author: phinner
topic: NoHorny
---`;

function compile(body: string) {
  return compileBlogMarkdown("src/blog/posts/en/a-post.md", `${frontmatter}\n\n${body}`);
}

function render(body: string): string {
  return renderToStaticMarkup(<PostBody document={compile(body).document} />);
}

function firstTagAttributes(html: string, name: string): Record<string, string> {
  const tag = new RegExp(`<${name}\\b([^>]*)>`).exec(html)?.[1] ?? "";
  return Object.fromEntries(
    [...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value])
  );
}

describe("compileBlogMarkdown", () => {
  test("exports only the frontmatter to a ?frontmatter import, and the document to the rest", () => {
    const transform = blogMarkdownPlugin().transform as (
      source: string,
      id: string
    ) => {
      code: string;
    };
    const exports = (id: string) =>
      [...transform(`${frontmatter}\n\nA body.`, id).code.matchAll(/^export const (\w+)/gm)].map(
        ([, name]) => name
      );

    expect(exports("/x/src/blog/posts/en/a-post.md?frontmatter")).toEqual(["frontmatter"]);
    expect(exports("/x/src/blog/posts/en/a-post.md")).toEqual(["frontmatter", "document"]);
  });

  test.each([
    ["NOTE", "Note"],
    ["tip", "Tip"]
  ])("renders GitHub's [!%s] alert as a callout titled %s", (marker, title) => {
    const html = render(`> [!${marker}]\n> Read this.`);

    expect(html).toMatch(
      new RegExp(
        `^<div[^>]*><div role="note"[^>]*><span[^>]*>${title}</span><p>Read this.</p></div></div>$`
      )
    );
  });

  test("titles a callout with the words after its marker, this site's own extension", () => {
    expect(render("> [!NOTE] The short version\n> Read this.")).toMatch(
      /^<div[^>]*><div role="note"[^>]*><span[^>]*>The short version<\/span><p>Read this.<\/p><\/div><\/div>$/
    );
  });

  test("refuses a marker GitHub has no alert for, naming the post", () => {
    expect(() => compile("> [!BANANA]\n> Read this.")).toThrow(
      /^src\/blog\/posts\/en\/a-post\.md: .*\[!BANANA\]/
    );
  });

  test.each([
    ["an inline link", "> [!x](https://example.com) Read this."],
    ["an image", "> ![A cat](/blog/cat.png) Read this."]
  ])("takes %s in a quote for no alert", (_label, written) => {
    const html = render(written);

    expect(html).toContain("<blockquote>");
    expect(html).not.toContain('role="note"');
  });

  test("leaves an escaped marker as the quote it is", () => {
    expect(render("> \\[!BANANA]\n> Read this.")).toMatch(
      /^<div[^>]*><blockquote><p>\[!BANANA\]\nRead this.<\/p><\/blockquote><\/div>$/
    );
  });

  test("renders callouts as the site's own, without enabling raw HTML", () => {
    const html = render("> [!WARNING] Upgrade first\n> Do not use <script>alert(1)</script>.");

    expect(html).toMatch(/<div role="note" class="[^"]*warning/);
    expect(html).toMatch(/<div role="note"[^>]*>[\s\S]*Upgrade first[\s\S]*<\/div>/);
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>");
  });

  test("includes the source path in invalid frontmatter errors", () => {
    expect(() =>
      compileBlogMarkdown(
        "src/blog/posts/en/broken.md",
        "---\ntitle: [unterminated\n---\n\nBroken."
      )
    ).toThrow(/^src\/blog\/posts\/en\/broken\.md:/);
  });
});

describe("post media", () => {
  test("renders repository-owned images and video", () => {
    const html =
      render(`<!-- ::post-image src="/blog/screenshot.png" alt="A <screen>" width="799" height="741" caption="The alert & details." -->

<!-- ::start:post-video src="/blog/demo.mp4" poster="/blog/poster.jpg" width="1550" height="911" caption="The demo." -->

A recording. [Download it.](/blog/demo.mp4)
<!-- ::end:post-video -->`);

    expect(firstTagAttributes(html, "img")).toMatchObject({
      src: "/blog/screenshot.png",
      alt: "A &lt;screen&gt;",
      width: "799",
      height: "741"
    });
    expect(html).toContain("The alert &amp; details.");
    expect(firstTagAttributes(html, "video")).toMatchObject({
      controls: "",
      muted: "",
      playsInline: "",
      preload: "metadata",
      poster: "/blog/poster.jpg",
      width: "1550",
      height: "911"
    });
    expect(html).toContain('<a href="/blog/demo.mp4">Download it.</a>');
  });

  test.each([
    '<!-- ::post-image src="https://example.com/a.png" alt="A" width="1" height="1" -->',
    '<!-- ::post-image src="/blog/../secret.png" alt="A" width="1" height="1" -->',
    '<!-- ::post-image src="/blog/a.png" alt="A" width="0" height="1" -->',
    '<!-- ::post-image src="/blog/a.png" alt="A" width="1" height="1" onclick="x" -->'
  ])("rejects unsafe or incomplete media syntax", (media) => {
    expect(() => compile(media)).toThrow();
  });

  test.each([
    [
      '<!-- ::start:post-image src="/blog/a.png" alt="A" width="1" height="1" -->\nA body.\n<!-- ::end:post-image -->',
      "post-image cannot have body content"
    ],
    [
      '<!-- ::start:post-video src="/blog/a.mp4" poster="/blog/a.png" width="1" height="1" -->\n<!-- ::end:post-video -->',
      "post-video requires fallback content"
    ],
    [
      '<!-- ::post-image src="/blog/a.png" width="1" height="1" -->',
      /^src\/blog\/posts\/en\/a-post\.md: post-image: .*alt/
    ]
  ])("explains what is wrong with %j", (media, message) => {
    expect(() => compile(media)).toThrow(message);
  });
});
