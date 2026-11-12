import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { PostBody } from "#app/components/blog/PostBody";
import { compileBlogMarkdown } from "./markdown";

const frontmatter = `---
title: A post
description: A useful description.
publishedAt: 2026-08-28
author: phinner
topic: NoHorny
---`;

function compile(body: string) {
  return compileBlogMarkdown("src/content/blog/a-post.md", `${frontmatter}\n\n${body}`);
}

function render(body: string): string {
  return renderToStaticMarkup(<PostBody document={compile(body).document} />);
}

describe("compileBlogMarkdown", () => {
  test("compiles validated frontmatter and a serializable document", () => {
    const compiled = compile("## Install\n\nUse **the release**.");

    expect(compiled.frontmatter.publishedAt).toBe("2026-08-28T00:00:00.000Z");
    expect(JSON.parse(JSON.stringify(compiled.document))).toEqual(compiled.document);
    expect(JSON.stringify(compiled.document)).not.toContain("title: A post");
  });

  test("renders callouts as the site's own, without enabling raw HTML", () => {
    const html = render("> [!WARNING] Upgrade first\n> Do not use <script>alert(1)</script>.");

    expect(html).toMatch(
      /<aside class="[^"]*warning[^"]*"><span class="[^"]*">Upgrade first<\/span>/,
    );
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>");
  });

  test("opens external links in a new tab while keeping site links in the same tab", () => {
    const html = render("[External](https://example.com/docs) and [internal](/blog).");

    expect(html).toContain(
      '<a href="https://example.com/docs" target="_blank" rel="noreferrer">External</a>',
    );
    expect(html).toContain('<a href="/blog">internal</a>');
  });

  test("renders repository-owned images and video", () => {
    const html =
      render(`<!-- ::post-image src="/blog/screenshot.png" alt="A <screen>" width="799" height="741" caption="The alert & details." -->

<!-- ::start:post-video src="/blog/demo.mp4" poster="/blog/poster.jpg" width="1550" height="911" caption="The demo." -->

A recording. [Download it.](/blog/demo.mp4)
<!-- ::end:post-video -->`);

    expect(html).toContain('src="/blog/screenshot.png"');
    expect(html).toContain('alt="A &lt;screen&gt;"');
    expect(html).toContain("The alert &amp; details.");
    expect(html).toContain(
      '<video controls="" muted="" preload="metadata" poster="/blog/poster.jpg"',
    );
    expect(html).toContain('<a href="/blog/demo.mp4">Download it.</a>');
  });

  test.each([
    '<!-- ::post-image src="https://example.com/a.png" alt="A" width="1" height="1" -->',
    '<!-- ::post-image src="/blog/../secret.png" alt="A" width="1" height="1" -->',
    '<!-- ::post-image src="/blog/a.png" alt="A" width="0" height="1" -->',
    '<!-- ::post-image src="/blog/a.png" alt="A" width="1" height="1" onclick="x" -->',
    '<!-- ::start:post-video src="/blog/a.mp4" poster="/blog/a.png" width="1" height="1" -->\n<!-- ::end:post-video -->',
  ])("rejects unsafe or incomplete media syntax", (media) => {
    expect(() => compile(media)).toThrow();
  });

  test("includes the source path in invalid frontmatter errors", () => {
    expect(() =>
      compileBlogMarkdown(
        "src/content/blog/broken.md",
        "---\ntitle: [unterminated\n---\n\nBroken.",
      ),
    ).toThrow(/^src\/content\/blog\/broken\.md:/);
  });
});
