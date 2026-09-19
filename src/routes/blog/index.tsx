import { For, Show } from "solid-js";
import { PostCard } from "#app/components/content/PostCard";
import { BLOG_CARD, PageMeta } from "#app/components/layout/PageMeta";
import { posts } from "#app/content/registry";
import { BLOG_DESCRIPTION } from "#app/data/site";
import * as styles from "./index.css";

export default function BlogIndex() {
  return (
    <>
      <PageMeta title="Blog" description={BLOG_DESCRIPTION} path="/blog" image={BLOG_CARD} />
      <div class={styles.page}>
        <header class={styles.header}>
          <h1 class={styles.pageTitle}>Blog</h1>
          <p class={styles.lede}>{BLOG_DESCRIPTION}</p>
        </header>

        <Show when={posts.length > 0} fallback={<EmptyPosts />}>
          <div class={styles.posts}>
            <For each={posts}>
              {(post) => (
                <article class={styles.article}>
                  <PostCard post={post} />
                </article>
              )}
            </For>
          </div>
        </Show>
      </div>
    </>
  );
}

function EmptyPosts() {
  return (
    <div class={styles.empty}>
      <span class={styles.emptyTitle}>Nothing published yet</span>
    </div>
  );
}
