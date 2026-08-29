import { For, Show } from "solid-js";
import { PostCard } from "#app/components/content/PostCard";
import { PageMeta } from "#app/components/layout/PageMeta";
import { posts } from "#app/content/registry";
import * as styles from "./index.css";

export default function BlogIndex() {
  return (
    <>
      <PageMeta title="Blog" description="Release notes and technical deep dives." path="/blog" />
      <div class={styles.page}>
        <header class={styles.header}>
          <h1 class={styles.pageTitle}>Blog</h1>
          <p class={styles.lede}>Release notes and technical deep dives.</p>
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
