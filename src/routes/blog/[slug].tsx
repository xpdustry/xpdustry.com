import { useParams } from "@solidjs/router";
import { For, Show, createMemo } from "solid-js";
import { Pager } from "#app/components/content/Pager";
import { NotFound } from "#app/components/layout/NotFound";
import { PageMeta } from "#app/components/layout/PageMeta";
import { ButtonLink } from "#app/components/system/Pressable";
import { authors } from "#app/content/authors";
import { posts, postsBySlug } from "#app/content/registry";
import { formatDate } from "#app/lib/format";
import { releaseLabel, releaseUrl } from "#app/lib/releases";
import { badge } from "#app/components/system/Badge.css";
import { document } from "#app/styles/markdown.css";
import * as styles from "./post.css";

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const post = createMemo(() => postsBySlug.get(params.slug));
  const navigation = createMemo(() => {
    const index = posts.findIndex((entry) => entry.slug === params.slug);
    const older = index >= 0 ? posts[index + 1] : undefined;
    const newer = index > 0 ? posts[index - 1] : undefined;
    return {
      older: older ? { href: `/blog/${older.slug}`, title: older.frontmatter.title } : undefined,
      newer: newer ? { href: `/blog/${newer.slug}`, title: newer.frontmatter.title } : undefined,
    };
  });

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

          <div class={styles.page}>
            <article class={styles.article}>
              <h1 class={styles.title}>{entry().frontmatter.title}</h1>

              <div class={styles.byline}>
                <a
                  class={styles.author}
                  href={authors[entry().frontmatter.author].url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    class={styles.avatar}
                    src={authors[entry().frontmatter.author].avatar}
                    alt=""
                    width="24"
                    height="24"
                  />
                  {entry().frontmatter.author}
                </a>
                <Separator />
                <time datetime={entry().frontmatter.publishedAt}>
                  {formatDate(entry().frontmatter.publishedAt)}
                </time>
                <Show when={entry().frontmatter.updatedAt}>
                  {(updated) => (
                    <>
                      <Separator />
                      <span>Updated {formatDate(updated())}</span>
                    </>
                  )}
                </Show>
                <Separator />
                <span class={badge.quiet}>{entry().frontmatter.topic}</span>
              </div>

              <div class={`${styles.prose} ${document}`} innerHTML={entry().html} />

              <Show when={(entry().frontmatter.releases ?? []).length > 0}>
                <aside class={styles.releases}>
                  <span class={styles.releaseIntro}>This post covers</span>
                  <For each={entry().frontmatter.releases}>
                    {(id) => (
                      <div class={styles.release}>
                        <span class={styles.releaseName}>{releaseLabel(id)}</span>
                        <ButtonLink
                          size="sm"
                          variant="outline"
                          href={releaseUrl(id)}
                          target="_blank"
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
                previous={navigation().older}
                next={navigation().newer}
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

function Separator() {
  return <span class={styles.separator} aria-hidden="true" />;
}
