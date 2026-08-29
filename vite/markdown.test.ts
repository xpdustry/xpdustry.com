import { describe, expect, test } from "vitest";
import { compileBlogMarkdown } from "./markdown";

const frontmatter = `---
title: A post
description: A useful description.
publishedAt: 2026-08-28
author: phinner
topic: NoHorny
---`;

describe("compileBlogMarkdown", () => {
  test("compiles validated frontmatter and article HTML", () => {
    const compiled = compileBlogMarkdown(
      "src/content/blog/a-post.md",
      `${frontmatter}\n\n## Install\n\nUse **the release**.`,
    );

    expect(compiled.frontmatter.publishedAt).toBe("2026-08-28T00:00:00.000Z");
    expect(compiled.html).toContain('<h2 id="install">');
    expect(compiled.html).toContain('<a href="#install" aria-hidden="true" class="anchor"');
    expect(compiled.html).toContain("Use <strong>the release</strong>.");
    expect(compiled.html).not.toContain("title: A post");
  });

  test("renders callouts without enabling raw HTML", () => {
    const compiled = compileBlogMarkdown(
      "src/content/blog/a-post.md",
      `${frontmatter}\n\n> [!WARNING] Upgrade first\n> Do not use <script>alert(1)</script>.`,
    );

    expect(compiled.html).toContain("markdown-alert-warning");
    expect(compiled.html).toContain("Upgrade first");
    expect(compiled.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(compiled.html).not.toContain("<script>");
  });

  test("opens external links in a new tab while keeping site links in the same tab", () => {
    const compiled = compileBlogMarkdown(
      "src/content/blog/a-post.md",
      `${frontmatter}\n\n[External](https://example.com/docs) and [internal](/blog).`,
    );

    expect(compiled.html).toContain(
      '<a href="https://example.com/docs" target="_blank" rel="noreferrer">External</a>',
    );
    expect(compiled.html).toContain('<a href="/blog">internal</a>');
  });

  test("renders repository-owned images and video", () => {
    const source = `${frontmatter}

<!-- ::post-image src="/blog/screenshot.png" alt="A <screen>" width="799" height="741" caption="The alert & details." -->

<!-- ::start:post-video src="/blog/demo.mp4" poster="/blog/poster.jpg" width="1550" height="911" caption="The demo." -->

A recording. [Download it.](/blog/demo.mp4)
<!-- ::end:post-video -->`;
    const compiled = compileBlogMarkdown("src/content/blog/a-post.md", source);

    expect(compiled.html).toContain('src="/blog/screenshot.png"');
    expect(compiled.html).toContain('alt="A &lt;screen&gt;"');
    expect(compiled.html).toContain("The alert &amp; details.");
    expect(compiled.html).toContain('<video controls preload="metadata"');
    expect(compiled.html).toContain('<a href="/blog/demo.mp4">Download it.</a>');
  });

  test.each([
    '<!-- ::post-image src="https://example.com/a.png" alt="A" width="1" height="1" -->',
    '<!-- ::post-image src="/blog/../secret.png" alt="A" width="1" height="1" -->',
    '<!-- ::post-image src="/blog/a.png" alt="A" width="0" height="1" -->',
    '<!-- ::post-image src="/blog/a.png" alt="A" width="1" height="1" onclick="x" -->',
  ])("rejects unsafe media syntax", (media) => {
    expect(() =>
      compileBlogMarkdown("src/content/blog/a-post.md", `${frontmatter}\n\n${media}`),
    ).toThrow();
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
