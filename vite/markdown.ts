import type { ComponentNode, MarkdownExtension, RenderOptions } from "@tanstack/markdown";
import { calloutsExtension } from "@tanstack/markdown/extensions/callouts";
import {
  parseCommentComponentBlock,
  parseComponentComment,
} from "@tanstack/markdown/extensions/comment-components";
import { renderHtml } from "@tanstack/markdown/html";
import { parseMarkdown } from "@tanstack/markdown/parser";
import * as v from "valibot";
import type { Plugin } from "vite";
import { parse as parseYaml } from "yaml";
import { ContentError, parseBlogFrontmatter, type BlogFrontmatter } from "../src/content/schema.ts";
import { NonBlankStringSchema } from "../src/lib/schema.ts";

export interface CompiledBlogMarkdown {
  frontmatter: BlogFrontmatter;
  html: string;
}

const MEDIA_NAMES = new Set(["post-image", "post-video"]);
const extensions: MarkdownExtension[] = [calloutsExtension(), mediaMarkdownExtension()];
const DimensionSchema = v.pipe(
  v.string(),
  v.toNumber("must be a number"),
  v.integer("must be an integer"),
  v.minValue(1, "must be at least 1"),
  v.maxValue(10_000, "must be at most 10000"),
);
const ImageAttributesSchema = v.strictObject({
  src: createMediaPathSchema([".png", ".jpg", ".jpeg", ".webp"]),
  alt: NonBlankStringSchema,
  width: DimensionSchema,
  height: DimensionSchema,
  caption: v.optional(v.string()),
});
const VideoAttributesSchema = v.strictObject({
  src: createMediaPathSchema([".mp4"]),
  poster: createMediaPathSchema([".png", ".jpg", ".jpeg", ".webp"]),
  width: DimensionSchema,
  height: DimensionSchema,
  caption: v.optional(v.string()),
});
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

export function compileBlogMarkdown(file: string, source: string): CompiledBlogMarkdown {
  const document = parseMarkdown(source, markdownOptions);

  return {
    frontmatter: parseBlogFrontmatter(file, parseFrontmatter(file, document.frontmatter)),
    html: openExternalLinksInNewTabs(renderHtml(document, markdownOptions)),
  };
}

function openExternalLinksInNewTabs(html: string): string {
  return html.replaceAll(/<a href="https?:\/\/[^"]+"/g, '$& target="_blank" rel="noreferrer"');
}

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
  if (node.children.length > 0) throw new Error("post-image cannot have body content");

  const { src, alt, width, height, caption } = parseMediaAttributes(node, ImageAttributesSchema);

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
  if (node.children.length === 0) throw new Error("post-video requires fallback content");

  const { src, poster, width, height, caption } = parseMediaAttributes(node, VideoAttributesSchema);

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

function createMediaPathSchema(extensions: readonly string[]) {
  return v.pipe(
    v.string(),
    v.check(
      (value) => isMediaPath(value, extensions),
      "must be a repository-owned blog media path",
    ),
  );
}

function isMediaPath(value: string, extensions: readonly string[]): boolean {
  const lower = value.toLowerCase();
  return (
    /^\/blog\/[a-z0-9][a-z0-9._/-]*$/i.test(value) &&
    !value.split("/").includes("..") &&
    extensions.some((extension) => lower.endsWith(extension))
  );
}

function parseMediaAttributes<TSchema extends v.GenericSchema>(
  node: ComponentNode,
  schema: TSchema,
): v.InferOutput<TSchema> {
  const result = v.safeParse(schema, node.attributes);
  if (result.success) return result.output;
  throw new Error(`${node.name}: ${v.summarize(result.issues)}`);
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
