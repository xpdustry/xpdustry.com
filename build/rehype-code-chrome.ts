import type { Element, ElementContent, Root } from "hast";
import { toString } from "hast-util-to-string";
import { visit } from "unist-util-visit";
import { TOKEN_CLASS, highlight } from "#build/highlight.ts";

/**
 * Prepares fenced code for the `pre` component in `mdx-components.tsx`: lifts
 * the language onto the `<pre>` as `data-language`, stashes the raw source in
 * `data-source` for the copy button, and replaces the code text with token
 * spans.
 *
 * Highlighting at build time rather than shipping a highlighter keeps the
 * client bundle free of a grammar it would only run once per page.
 */
export function rehypeCodeChrome() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "pre") return;
      const code = node.children.find(
        (child): child is Element => child.type === "element" && child.tagName === "code",
      );
      if (!code) return;

      const source = toString(code);
      const language = languageOf(code);

      node.properties = {
        ...node.properties,
        "data-language": language ?? "text",
        "data-source": source,
      };

      code.children = highlight(source, language).map((token): ElementContent =>
        token.kind === null
          ? { type: "text", value: token.value }
          : {
              type: "element",
              tagName: "span",
              properties: { className: [TOKEN_CLASS[token.kind]] },
              children: [{ type: "text", value: token.value }],
            },
      );
    });
  };
}

function languageOf(code: Element): string | undefined {
  const classes = code.properties?.className;
  const list = Array.isArray(classes) ? classes : typeof classes === "string" ? [classes] : [];
  for (const entry of list) {
    if (typeof entry === "string" && entry.startsWith("language-")) {
      return entry.slice("language-".length);
    }
  }
  return undefined;
}
