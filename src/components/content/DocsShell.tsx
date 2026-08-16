import { For, type ParentProps } from "solid-js";
import { TableOfContents } from "#app/components/content/TableOfContents.tsx";
import { ChevronDownIcon } from "#app/components/system/Icons";
import { docsForProject } from "#app/content/registry";
import { projects } from "#app/data/projects";
import type { DocHeading } from "#build/rehype-heading-anchors";

export interface DocsShellProps {
  project: string;
  currentPath: string;
  currentTitle: string;
  headings: readonly DocHeading[];
}

/**
 * The frame around a documentation page: sidebar, article column, rail.
 *
 * Below 900px the sidebar folds into a `<details>` disclosure rather than a
 * permanently open list. That is a native element, so the mobile nav opens
 * and closes with JavaScript off.
 */
export function DocsShell(props: ParentProps<DocsShellProps>) {
  return (
    <div class="docs-layout wrap grid items-start gap-8 py-8 pb-24 lg:gap-12 [&>*]:min-w-0">
      <aside class="docs-rail sticky top-26 hidden scrollbar-thin overflow-y-auto overscroll-contain lg:block">
        <DocsNav project={props.project} currentPath={props.currentPath} />
      </aside>

      <div>
        <details class="docs-mobile mb-6 lg:hidden">
          <summary class="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg border-2 border-line bg-panel px-4 py-3 text-sm font-bold [&_svg]:size-4.5 [&::-webkit-details-marker]:hidden">
            {props.currentTitle}
            <ChevronDownIcon />
          </summary>
          <DocsNav project={props.project} currentPath={props.currentPath} />
        </details>

        {props.children}
      </div>

      <aside class="docs-rail sticky top-26 hidden scrollbar-thin overflow-y-auto overscroll-contain xl:block">
        <TableOfContents headings={props.headings} />
      </aside>
    </div>
  );
}

function DocsNav(props: { project: string; currentPath: string }) {
  const pages = () => docsForProject(props.project);
  const projectName = () =>
    projects.find((entry) => entry.slug === props.project)?.name ?? props.project;

  return (
    <nav class="grid gap-8" aria-label="Documentation">
      <div class="grid gap-0.5">
        <h2 class="mb-2 font-mono text-data font-medium tracking-wider text-ink-faint uppercase">
          {projectName()}
        </h2>
        <For each={pages()}>
          {(page) => (
            <a
              class="flex items-center justify-between gap-2 border-l-2 border-line-soft px-4 py-2 text-sm font-semibold text-ink-muted no-underline transition-colors hover:bg-panel hover:text-ink aria-[current=page]:bg-panel aria-[current=page]:font-bold aria-[current=page]:text-ink"
              href={page.path}
              aria-current={page.path === props.currentPath ? "page" : undefined}
            >
              {page.frontmatter.title}
            </a>
          )}
        </For>
      </div>
    </nav>
  );
}
