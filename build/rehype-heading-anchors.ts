import { valueToEstree } from "estree-util-value-to-estree";
import type { Element, Root } from "hast";
import { toString } from "hast-util-to-string";
import { visit } from "unist-util-visit";

export interface DocHeading {
  depth: 2 | 3;
  id: string;
  text: string;
}

/**
 * Gives every `h2`/`h3` a trailing anchor link and exports the heading list as
 * `headings` so a table of contents renders during SSR. Deriving the list from
 * the rendered DOM instead (the way a client-side rail would) leaves the TOC
 * missing until hydration and absent entirely without JavaScript.
 *
 * Runs after `rehype-slug`, which supplies the ids.
 */
export function rehypeHeadingAnchors() {
  return (tree: Root) => {
    const headings: DocHeading[] = [];

    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "h2" && node.tagName !== "h3") return;
      const id = node.properties?.id;
      if (typeof id !== "string" || id === "") return;

      const text = toString(node);
      headings.push({ depth: node.tagName === "h2" ? 2 : 3, id, text });

      node.children.push({
        type: "element",
        tagName: "a",
        properties: {
          className: ["anchor"],
          href: `#${id}`,
          "aria-label": `Link to the section ${text}`,
        },
        children: [{ type: "text", value: "#" }],
      });
    });

    tree.children.unshift(exportConst("headings", headings));
  };
}

/** Builds the `export const <name> = <value>` node MDX turns into real ESM. */
function exportConst(name: string, value: unknown) {
  return {
    type: "mdxjsEsm" as const,
    value: "",
    data: {
      estree: {
        type: "Program" as const,
        sourceType: "module" as const,
        body: [
          {
            type: "ExportNamedDeclaration" as const,
            specifiers: [],
            source: null,
            attributes: [],
            declaration: {
              type: "VariableDeclaration" as const,
              kind: "const" as const,
              declarations: [
                {
                  type: "VariableDeclarator" as const,
                  id: { type: "Identifier" as const, name },
                  init: valueToEstree(value),
                },
              ],
            },
          },
        ],
      },
    },
  };
}
