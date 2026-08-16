import { Dynamic } from "@solidjs/web";
import { Show, createMemo } from "solid-js";
import { DocsShell } from "#app/components/content/DocsShell.tsx";
import { mdxComponents } from "#app/components/content/mdx-components.tsx";
import { Pager } from "#app/components/content/Pager.tsx";
import { ARTICLE_BLOBS, BlobField } from "#app/components/layout/BlobField";
import { PageMeta } from "#app/components/layout/PageMeta";
import { GitHubIcon } from "#app/components/system/Icons";
import { ButtonLink } from "#app/components/system/Pressable";
import { docsByPath, docsForProject } from "#app/content/registry";
import { ContentError } from "#app/content/schema";
import {
  overviewPath,
  projectIcon,
  projectsBySlug,
  repositoryUrl,
  type ProjectSlug,
} from "#app/data/projects";

export interface DocPageProps {
  project: ProjectSlug;
  path: string;
}

/** One documentation page, assembled from the registry. */
export function DocPage(props: DocPageProps) {
  /**
   * A route file names a path the registry is expected to hold, so a miss is
   * a repository mistake — content renamed or deleted out from under its
   * route — rather than a visitor asking for a page that never existed. That
   * second case never reaches here: the catch-all route owns it. So this
   * fails like the registry's other invariants instead of quietly serving a
   * 404 from a route that does exist.
   */
  const page = createMemo(() => {
    const doc = docsByPath.get(props.path);
    if (!doc) throw new ContentError(props.path, "no project page is registered at this route");
    return doc;
  });
  const project = createMemo(() => projectsBySlug.get(props.project));
  const overview = createMemo(() => {
    const entry = project();
    return entry && overviewPath(entry);
  });

  const siblings = createMemo(() => docsForProject(props.project));
  const index = createMemo(() => siblings().findIndex((doc) => doc.path === props.path));
  const previous = createMemo(() => (index() > 0 ? siblings()[index() - 1] : undefined));
  const next = createMemo(() => (index() >= 0 ? siblings()[index() + 1] : undefined));

  return (
    <>
      <PageMeta
        title={page().frontmatter.title}
        description={page().frontmatter.description}
        path={page().path}
      />
      <BlobField artwork={ARTICLE_BLOBS} />

      <DocsShell
        project={props.project}
        currentPath={page().path}
        currentTitle={page().frontmatter.title}
        headings={page().headings}
      >
        <div class="mb-8">
          <nav
            class="mb-4 flex flex-wrap items-center gap-2 font-mono text-data text-ink-faint [&_a]:text-inherit [&_a]:no-underline [&_a:hover]:text-ink [&_a:hover]:underline"
            aria-label="Breadcrumb"
          >
            <a href="/projects">Projects</a>
            <span aria-hidden="true">/</span>
            {/* ts is so cursed... */}
            <Dynamic
              component={(overview() && overview() !== page().path && "a") || "span"}
              href={overview()}
            >
              {project()?.name}
            </Dynamic>
            <Show when={overview() !== page().path}>
              <span aria-hidden="true">/</span>
              <span>{page().frontmatter.title}</span>
            </Show>
          </nav>
          <div class="flex items-center gap-4">
            <Show when={project()}>
              {(entry) => (
                <span class="grid size-14 shrink-0 place-items-center rounded-xl border-2 border-line-soft bg-panel-sunk p-2">
                  <img
                    class={[
                      "max-h-full max-w-full",
                      projectIcon(entry()).fallback ? "dark:invert" : undefined,
                    ]}
                    src={projectIcon(entry()).src}
                    alt=""
                    width="40"
                    height="40"
                  />
                </span>
              )}
            </Show>
            <h1 class="text-4xl font-extrabold tracking-tight stretch-110 sm:text-5xl">
              {page().frontmatter.title}
            </h1>
          </div>
          <div class="mt-6 flex flex-wrap items-center gap-3 border-t border-line-soft pt-6">
            <Show when={project()}>
              {(entry) => (
                <ButtonLink
                  size="sm"
                  variant="outline"
                  href={repositoryUrl(entry())}
                  rel="noreferrer"
                >
                  <GitHubIcon />
                  Source
                </ButtonLink>
              )}
            </Show>
          </div>
        </div>

        <article class="doc max-w-full min-w-0 leading-relaxed text-ink-muted">
          <Dynamic component={page().Content} components={mdxComponents} />
        </article>

        <Pager
          label="Pagination"
          previous={
            previous() && {
              href: previous()!.path,
              title: previous()!.frontmatter.title,
            }
          }
          next={
            next() && {
              href: next()!.path,
              title: next()!.frontmatter.title,
            }
          }
        />
      </DocsShell>
    </>
  );
}
