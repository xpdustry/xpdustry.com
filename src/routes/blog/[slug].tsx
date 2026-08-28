import { useParams } from "@solidjs/router";
import { For, Show, createMemo } from "solid-js";
import { Pager } from "#app/components/content/Pager";
import { NotFound } from "#app/components/layout/NotFound";
import { PageMeta } from "#app/components/layout/PageMeta";
import { ReticulateField } from "#app/components/layout/ReticulateField";
import { ButtonLink } from "#app/components/system/Pressable";
import { posts, postsBySlug } from "#app/content/registry";
import { formatDate } from "#app/lib/format";
import { releaseUrl, releaseLabel } from "#app/lib/releases";

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const post = createMemo(() => postsBySlug.get(params.slug));

  // Newest first in the registry, so the neighbor one index later is older.
  const index = createMemo(() => posts.findIndex((entry) => entry.slug === params.slug));
  const older = createMemo(() => (index() >= 0 ? posts[index() + 1] : undefined));
  const newer = createMemo(() => (index() > 0 ? posts[index() - 1] : undefined));

  return (
    <Show when={post()} fallback={<NotFound />}>
      {(entry) => (
        <>
          <PageMeta
            title={entry().frontmatter.title}
            description={entry().frontmatter.description}
            path={`/blog/${entry().slug}`}
            type="article"
            publishedAt={entry().frontmatter.publishedAt}
          />
          <ReticulateField />

          <div class="wrap py-16 pb-24">
            <article class="mx-auto w-full max-w-prose">
              <h1 class="text-4xl font-extrabold tracking-tight text-balance stretch-110 sm:text-5xl">
                {entry().frontmatter.title}
              </h1>

              <div class="my-8 flex flex-wrap items-center gap-3 border-y border-line-soft py-4 text-sm text-ink-muted">
                <a
                  class="inline-flex min-w-0 items-center gap-2 font-bold wrap-anywhere text-ink"
                  href={`https://github.com/${encodeURIComponent(entry().frontmatter.author)}`}
                  rel="noreferrer"
                >
                  <Show when={entry().frontmatter.pfp}>
                    {(pfp) => (
                      <img
                        class="block size-6 shrink-0 rounded-full object-cover"
                        src={pfp()}
                        alt=""
                        width="24"
                        height="24"
                      />
                    )}
                  </Show>
                  {entry().frontmatter.author}
                </a>
                <span class="size-1 shrink-0 rounded-full bg-line-soft" />
                <time datetime={entry().frontmatter.publishedAt}>
                  {formatDate(entry().frontmatter.publishedAt)}
                </time>
                <Show when={entry().frontmatter.updatedAt}>
                  {(updated) => (
                    <>
                      <span class="size-1 shrink-0 rounded-full bg-line-soft" />
                      <span>Updated {formatDate(updated())}</span>
                    </>
                  )}
                </Show>
                <span class="size-1 shrink-0 rounded-full bg-line-soft" />
                <span class="inline-flex items-center gap-2 rounded-sm border border-line-soft bg-page-sunk px-3 py-0.75 font-mono text-xs leading-normal font-semibold tracking-tight whitespace-nowrap text-ink-muted">
                  {entry().frontmatter.topic}
                </span>
              </div>

              <div
                class="doc max-w-full min-w-0 leading-relaxed text-ink-muted"
                innerHTML={entry().html}
              />

              <Show when={(entry().frontmatter.releases ?? []).length > 0}>
                <aside class="mt-12 grid gap-3 rounded-lg border border-line-soft bg-panel px-6 py-4">
                  <span class="font-mono text-data tracking-tight text-ink-faint">
                    This post covers
                  </span>
                  <For each={entry().frontmatter.releases}>
                    {(id) => (
                      <div class="flex flex-wrap items-center justify-between gap-3">
                        <span class="font-bold wrap-anywhere text-ink">{releaseLabel(id)}</span>
                        <ButtonLink
                          size="sm"
                          variant="outline"
                          href={releaseUrl(id)}
                          rel="noreferrer"
                        >
                          Full changelog
                        </ButtonLink>
                      </div>
                    )}
                  </For>
                </aside>
              </Show>

              <Pager
                label="More posts"
                previous={
                  older() && {
                    href: `/blog/${older()!.slug}`,
                    title: older()!.frontmatter.title,
                  }
                }
                next={
                  newer() && {
                    href: `/blog/${newer()!.slug}`,
                    title: newer()!.frontmatter.title,
                  }
                }
                previousLabel="Older"
                nextLabel="Newer"
              />
            </article>
          </div>
        </>
      )}
    </Show>
  );
}
