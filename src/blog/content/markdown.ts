import type {
  BlockNode,
  ComponentNode,
  MarkdownDocument,
  MarkdownExtension,
  ParseOptions
} from "@tanstack/markdown";
import { calloutsExtension } from "@tanstack/markdown/extensions/callouts";
import {
  parseCommentComponentBlock,
  parseComponentComment
} from "@tanstack/markdown/extensions/comment-components";
import { parseMarkdown } from "@tanstack/markdown/parser";
import * as v from "valibot";
import type { Plugin } from "vite";
import { parse as parseYaml } from "yaml";
import { POST_ELEMENTS } from "./elements.ts";
import { ContentError } from "./errors.ts";
import { IMAGE_EXTENSIONS, NonBlankStringSchema, blogMediaPathSchema } from "./fields.ts";
import type { PostModule } from "./registry.ts";
import { parseBlogFrontmatter } from "./schema.ts";

const DimensionSchema = v.pipe(
  v.string(),
  v.toNumber("must be a number"),
  v.integer("must be an integer"),
  v.minValue(1, "must be at least 1"),
  v.maxValue(10_000, "must be at most 10000")
);
const ImageAttributesSchema = v.strictObject({
  src: blogMediaPathSchema(IMAGE_EXTENSIONS),
  alt: NonBlankStringSchema,
  width: DimensionSchema,
  height: DimensionSchema,
  caption: v.optional(v.string())
});
const VideoAttributesSchema = v.strictObject({
  src: blogMediaPathSchema([".mp4"]),
  webm: v.optional(blogMediaPathSchema([".webm"])),
  poster: blogMediaPathSchema(IMAGE_EXTENSIONS),
  width: DimensionSchema,
  height: DimensionSchema,
  caption: v.optional(v.string())
});

const MEDIA = {
  "post-image": { tagName: POST_ELEMENTS.image, schema: ImageAttributesSchema, body: false },
  "post-video": { tagName: POST_ELEMENTS.video, schema: VideoAttributesSchema, body: true }
} as const;

const extensions: MarkdownExtension[] = [
  calloutsExtension(),
  mediaExtension(),
  calloutElementExtension()
];
const parseOptions: ParseOptions = { extensions, frontmatter: true, headingIds: true };

export function compileBlogMarkdown(file: string, source: string): PostModule {
  const { frontmatter, ...document } = parseMarkdown(source, parseOptions);

  return {
    frontmatter: parseBlogFrontmatter(file, parseFrontmatter(file, frontmatter)),
    document: document satisfies MarkdownDocument
  };
}

export function blogMarkdownPlugin(): Plugin {
  return {
    name: "xpdustry:blog-markdown",
    enforce: "pre",
    transform(source, id) {
      const file = id.split("?", 1)[0]?.replaceAll("\\", "/");
      if (!file?.endsWith(".md") || !file.includes("/src/blog/posts/")) return;

      try {
        const compiled = compileBlogMarkdown(file, source);
        return {
          code: [
            `export const frontmatter = ${serialize(compiled.frontmatter)};`,
            ...(new URLSearchParams(id.split("?")[1]).has("frontmatter")
              ? []
              : [`export const document = ${serialize(compiled.document)};`])
          ].join("\n"),
          map: null
        };
      } catch (error) {
        this.error(error instanceof Error ? error : new Error(String(error)));
      }
    }
  };
}

function parseFrontmatter(file: string, source: string | undefined): unknown {
  try {
    return parseYaml(source ?? "");
  } catch (error) {
    throw new ContentError(file, "invalid YAML frontmatter", { cause: error });
  }
}

type MediaName = keyof typeof MEDIA;
type Media = (typeof MEDIA)[MediaName];

const isMediaName = (name: string): name is MediaName => Object.hasOwn(MEDIA, name);

function assertBody(node: ComponentNode, media: Media) {
  const hasBody = node.children.length > 0;
  if (media.body && !hasBody) throw new Error(`${node.name} requires fallback content`);
  if (!media.body && hasBody) throw new Error(`${node.name} cannot have body content`);
}

/** The validated attributes as element properties, without the optional ones left out. */
function mediaProperties(node: ComponentNode, media: Media): Record<string, string> {
  const result = v.safeParse(media.schema, node.attributes);
  if (!result.success) throw new Error(`${node.name}: ${v.summarize(result.issues)}`);
  return Object.fromEntries(
    Object.entries(result.output).flatMap(([key, value]) =>
      value === undefined ? [] : [[key, String(value)]]
    )
  );
}

function mediaExtension(): MarkdownExtension {
  return {
    name: "xpdustry:post-media",
    parseBlock(context) {
      const comment = parseComponentComment(context.lines[context.index] ?? "");
      if (!comment || !isMediaName(comment.name)) return;

      const node = parseCommentComponentBlock(context);
      if (!node) return;
      const media = MEDIA[node.name as MediaName];
      assertBody(node, media);
      return { ...node, tagName: media.tagName, properties: mediaProperties(node, media) };
    }
  };
}

function calloutElementExtension(): MarkdownExtension {
  const convert = (nodes: BlockNode[]): BlockNode[] =>
    nodes.map((node): BlockNode => {
      if (node.type === "callout") {
        return {
          type: "component",
          name: "callout",
          tagName: POST_ELEMENTS.callout,
          attributes: {},
          properties: { kind: node.kind, title: node.title },
          children: convert(node.children)
        } satisfies ComponentNode;
      }
      if (node.type === "blockquote" || node.type === "component") {
        return { ...node, children: convert(node.children) };
      }
      return node;
    });

  return {
    name: "xpdustry:callout-elements",
    transformDocument(document) {
      return { ...document, children: convert(document.children) };
    }
  };
}

function serialize(value: unknown): string {
  const json = JSON.stringify(value);
  if (json === undefined) throw new Error("cannot serialize Markdown module export");
  return json.replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029");
}
