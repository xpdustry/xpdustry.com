import { For, Show } from "solid-js";
import { PostCard } from "#app/components/content/PostCard";
import { PageMeta } from "#app/components/layout/PageMeta";
import { ReticulateField } from "#app/components/layout/ReticulateField";
import { posts } from "#app/content/registry";

export default function BlogIndex() {
  return (
    <>
      <PageMeta title="Blog" description="Release notes and technical deep dives." path="/blog" />
      <ReticulateField />

      <div class="wrap py-12 pb-24">
        <header class="mb-16 max-w-prose">
          <h1 class="text-4xl font-extrabold tracking-tight stretch-110 sm:text-5xl">Blog</h1>
          <p class="mt-4 max-w-prose text-base text-ink-muted sm:text-lg">
            Release notes and technical deep dives.
          </p>
        </header>

        <Show
          when={posts.length > 0}
          fallback={
            <div class="grid justify-items-start gap-3 rounded-2xl border border-dashed border-line-soft bg-panel-sunk px-6 py-8 text-ink-muted">
              <span class="font-bold text-ink">Nothing published yet</span>
            </div>
          }
        >
          <div class="project-grid grid auto-rows-fr gap-6 [&>article]:grid">
            <For each={posts}>
              {(post) => (
                <article>
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
