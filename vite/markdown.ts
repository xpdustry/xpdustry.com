import type { ComponentNode, MarkdownExtension, RenderOptions } from "@tanstack/markdown";
import { calloutsExtension } from "@tanstack/markdown/extensions/callouts";
import {
  parseCommentComponentBlock,
  parseComponentComment,
} from "@tanstack/markdown/extensions/comment-components";
import { renderHtml } from "@tanstack/markdown/html";
import { parseMarkdown } from "@tanstack/markdown/parser";
import type { Plugin } from "vite";
import { parse as parseYaml } from "yaml";
import { ContentError, parseBlogFrontmatter, type BlogFrontmatter } from "../src/content/schema.ts";

export interface CompiledBlogMarkdown {
  frontmatter: BlogFrontmatter;
  html: string;
}

const MEDIA_NAMES = new Set(["post-image", "post-video"]);
const extensions: MarkdownExtension[] = [calloutsExtension(), mediaMarkdownExtension()];
const markdownOptions: RenderOptions = {
  allowHtml: false,
  extensions,
  headingAnchors: {
    content: "#",
    className: "anchor",
    ariaHidden: true,
    tabIndex: -1,
  },
};

/** Compiles one repository-owned blog post into data the app can import. */
export function compileBlogMarkdown(file: string, source: string): CompiledBlogMarkdown {
  const document = parseMarkdown(source, markdownOptions);

  return {
    frontmatter: parseBlogFrontmatter(file, parseFrontmatter(file, document.frontmatter)),
    html: renderHtml(document, markdownOptions),
  };
}

/** Turns imported blog Markdown into a plain ESM module during dev and build. */
export function blogMarkdownPlugin(): Plugin {
  return {
    name: "xpdustry:blog-markdown",
    enforce: "pre",
    transform(source, id) {
      const file = id.split("?", 1)[0]?.replaceAll("\\", "/");
      if (!file?.endsWith(".md") || !file.includes("/src/content/blog/")) return;

      try {
        const compiled = compileBlogMarkdown(file, source);
        return {
          code: [
            `export const frontmatter = ${serialize(compiled.frontmatter)};`,
            `export const html = ${serialize(compiled.html)};`,
          ].join("\n"),
          map: null,
        };
      } catch (error) {
        this.error(error instanceof Error ? error : new Error(String(error)));
      }
    },
  };
}

function parseFrontmatter(file: string, source: string | undefined): unknown {
  try {
    return parseYaml(source ?? "");
  } catch (error) {
    throw new ContentError(file, "invalid YAML frontmatter", { cause: error });
  }
}

function mediaMarkdownExtension(): MarkdownExtension {
  return {
    name: "xpdustry:post-media",
    parseBlock(context) {
      const comment = parseComponentComment(context.lines[context.index] ?? "");
      if (!comment || !MEDIA_NAMES.has(comment.name)) return;
      return parseCommentComponentBlock(context);
    },
    renderHtml(node, context) {
      if (node.type !== "component") return;
      if (node.name === "post-image") return renderImage(node);
      if (node.name === "post-video") {
        return renderVideo(node, node.children.map(context.renderBlock).join("\n"));
      }
    },
  };
}

function renderImage(node: ComponentNode): string {
  assertOnly(node, ["src", "alt", "width", "height", "caption"]);
  if (node.children.length > 0) throw new Error("post-image cannot have body content");

  const src = mediaPath(required(node, "src"), [".png", ".jpg", ".jpeg", ".webp"]);
  const alt = required(node, "alt");
  const width = dimension(required(node, "width"));
  const height = dimension(required(node, "height"));
  const caption = node.attributes.caption;

  return [
    '<figure class="media post-media">',
    '<span class="post-media__frame">',
    `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}" width="${width}" height="${height}" loading="lazy" decoding="async">`,
    "</span>",
    caption ? `<figcaption class="post-media__caption">${escapeText(caption)}</figcaption>` : "",
    "</figure>",
  ].join("");
}

function renderVideo(node: ComponentNode, fallback: string): string {
  assertOnly(node, ["src", "poster", "width", "height", "caption"]);
  if (node.children.length === 0) throw new Error("post-video requires fallback content");

  const src = mediaPath(required(node, "src"), [".mp4"]);
  const poster = mediaPath(required(node, "poster"), [".png", ".jpg", ".jpeg", ".webp"]);
  const width = dimension(required(node, "width"));
  const height = dimension(required(node, "height"));
  const caption = node.attributes.caption;

  return [
    '<figure class="media post-media">',
    '<span class="post-media__frame">',
    `<video controls preload="metadata" poster="${escapeAttribute(poster)}" width="${width}" height="${height}">`,
    `<source src="${escapeAttribute(src)}" type="video/mp4">`,
    fallback,
    "</video>",
    "</span>",
    caption ? `<figcaption class="post-media__caption">${escapeText(caption)}</figcaption>` : "",
    "</figure>",
  ].join("");
}

function assertOnly(node: ComponentNode, allowed: readonly string[]): void {
  const names = new Set(allowed);
  for (const name of Object.keys(node.attributes)) {
    if (!names.has(name)) throw new Error(`${node.name}: unsupported attribute ${name}`);
  }
}

function required(node: ComponentNode, name: string): string {
  const value = node.attributes[name];
  if (!value) throw new Error(`${node.name}: missing ${name}`);
  return value;
}

function mediaPath(value: string, extensions: readonly string[]): string {
  const lower = value.toLowerCase();
  const valid =
    /^\/blog\/[a-z0-9][a-z0-9._/-]*$/i.test(value) &&
    !value.split("/").includes("..") &&
    extensions.some((extension) => lower.endsWith(extension));
  if (!valid) throw new Error(`invalid blog media path: ${value}`);
  return value;
}

function dimension(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10_000) {
    throw new Error(`invalid media dimension: ${value}`);
  }
  return parsed;
}

function escapeAttribute(value: string): string {
  return escapeText(value).replaceAll('"', "&quot;");
}

function escapeText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function serialize(value: unknown): string {
  const json = JSON.stringify(value);
  if (json === undefined) throw new Error("cannot serialize Markdown module export");
  return json.replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029");
}
