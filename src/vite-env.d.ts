/// <reference types="vite/client" />
/// <reference types="filesystem-routing/types" />

declare module "virtual:solid-ssr-handler" {
  export function handleRequest(request: Request): Promise<Response>;
  const handler: { fetch: (request: Request) => Promise<Response> };
  export default handler;
}

declare module "*.mdx" {
  import type { Component } from "solid-js";
  import type { DocHeading } from "#build/rehype-heading-anchors";

  export const frontmatter: unknown;
  export const headings: DocHeading[];
  const MDXContent: Component<Record<string, unknown>>;
  export default MDXContent;
}
