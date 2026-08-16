/**
 * The component map every MDX page is rendered with.
 *
 * MDX addresses each Markdown-produced element through `_components.<tag>`
 * and defaults those entries to plain tag strings. Solid compiles that
 * expression as a component call, and a string is not callable, so the map
 * has to be complete: every tag MDX can emit needs a real component, not just
 * the three this file gives chrome to.
 */

import { Dynamic } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { NoHydration, omit, type ParentProps } from "solid-js";
import { CopyButton } from "#app/components/system/CopyButton";

/** Everything Markdown produces that needs no chrome of its own. */
const PASSTHROUGH = [
  "blockquote",
  "br",
  "code",
  "del",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "img",
  "input",
  "li",
  "ol",
  "p",
  "section",
  "span",
  "strong",
  "sup",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "ul",
] as const;

type AnyProps = Record<string, unknown>;

function passthrough(tag: string) {
  return (props: AnyProps) => <Dynamic component={tag} {...props} />;
}

/**
 * A fenced code block. The rehype pass put the language and the raw source on
 * the `<pre>`, so the copy button copies exactly what was written rather than
 * the highlighted DOM's text.
 */
function Pre(props: ParentProps<JSX.HTMLAttributes<HTMLPreElement> & AnyProps>) {
  const language = () => (props["data-language"] as string | undefined) ?? "text";
  const source = () => (props["data-source"] as string | undefined) ?? "";
  const rest = () => omit(props, "children", "data-language", "data-source", "class");

  return (
    <figure class="overflow-hidden rounded-2xl border-2 border-line bg-panel-sunk">
      <figcaption class="flex items-center justify-between gap-4 border-b border-line-soft bg-page-sunk py-2 pr-2 pl-4">
        <span class="font-mono text-data tracking-tight text-ink-faint">{language()}</span>
        <CopyButton
          value={source()}
          variant="plain"
          size="sm"
          announcement={`Copied the ${language()} example`}
        />
      </figcaption>
      <NoHydration>
        <pre
          {...rest()}
          class="m-0 overflow-x-auto px-6 py-4 font-mono text-data leading-relaxed tracking-tight tab-2 text-ink"
        >
          {props.children}
        </pre>
      </NoHydration>
    </figure>
  );
}

/**
 * Tables scroll inside their own frame. Without the wrapper one wide table
 * widens the page and every layout below it grows a horizontal scrollbar.
 */
function Table(props: ParentProps<JSX.HTMLAttributes<HTMLTableElement>>) {
  const rest = () => omit(props, "children");
  return (
    <div class="max-w-full min-w-0 overflow-x-auto rounded-2xl border-2 border-line bg-panel">
      <NoHydration>
        <table {...rest()}>{props.children}</table>
      </NoHydration>
    </div>
  );
}

/**
 * Links out of an article open in the same tab, but a cross-origin one gets
 * `rel="noreferrer"` so the destination learns nothing about where it came
 * from.
 */
function Anchor(props: ParentProps<JSX.AnchorHTMLAttributes<HTMLAnchorElement>>) {
  const external = () => typeof props.href === "string" && /^https?:\/\//.test(props.href);
  const rest = () => omit(props, "children");
  return (
    <a {...rest()} rel={external() ? "noreferrer" : undefined}>
      {props.children}
    </a>
  );
}

export const mdxComponents: Record<string, unknown> = {
  ...Object.fromEntries(PASSTHROUGH.map((tag) => [tag, passthrough(tag)])),
  pre: Pre,
  table: Table,
  a: Anchor,
};
