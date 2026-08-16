import { For, Show } from "solid-js";
import type { DocHeading } from "#build/rehype-heading-anchors";

/**
 * The on-this-page rail, built from the headings the MDX pass exported. It
 * renders during SSR, so it is present without JavaScript and cannot drift
 * out of step with the prose the way a hand-written list would.
 */
export function TableOfContents(props: { headings: readonly DocHeading[] }) {
  return (
    <Show when={props.headings.length > 1}>
      <nav class="grid gap-0.5" aria-labelledby="toc-title">
        <span
          class="mb-2 font-mono text-data font-medium tracking-wider text-ink-faint uppercase"
          id="toc-title"
        >
          On this page
        </span>
        <For each={props.headings}>
          {(heading) => (
            <a
              class="block border-l-2 border-line-soft px-3 py-2 text-xs font-semibold text-ink-muted no-underline transition-colors hover:border-line hover:text-ink data-[depth=3]:pl-6"
              href={`#${heading.id}`}
              data-depth={String(heading.depth)}
            >
              {heading.text}
            </a>
          )}
        </For>
      </nav>
    </Show>
  );
}
