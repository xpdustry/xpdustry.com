import { Show } from "solid-js";
import { CardLink } from "#app/components/system/Pressable";
import type { BlogPost } from "#app/content/registry";
import { formatDate } from "#app/lib/format";

/**
 * One post, as a card you press.
 *
 * The whole card is the link, which is why nothing inside it is one: an
 * anchor cannot contain an anchor, and a card with a "read more" link in the
 * corner asks the reader to aim at the one part of it that works.
 *
 * Shared by the blog index and the homepage on purpose. A post teaser that
 * looked different in the two places it appears would read as two kinds of
 * thing.
 */
export function PostCard(props: { post: BlogPost; compact?: boolean }) {
  if (props.compact) {
    return (
      <CardLink
        class="block h-full"
        faceClass="flex flex-col items-stretch justify-start gap-1.5 p-4 text-left"
        href={`/blog/${props.post.slug}`}
      >
        <span class="flex items-center justify-between gap-3 font-mono text-data tracking-tight text-ink-faint">
          <span class="truncate" data-topic={props.post.frontmatter.topic}>
            {props.post.frontmatter.topic}
          </span>
          <time datetime={props.post.frontmatter.publishedAt}>
            {formatDate(props.post.frontmatter.publishedAt)}
          </time>
        </span>
        <span class="text-base leading-tight font-bold text-ink">
          {props.post.frontmatter.title}
        </span>
      </CardLink>
    );
  }

  return (
    <CardLink
      class="h-full"
      faceClass="flex flex-col items-stretch justify-start gap-3 p-6 text-left"
      href={`/blog/${props.post.slug}`}
    >
      <span
        class="inline-flex self-start rounded-sm border border-line-soft bg-page-sunk px-3 py-0.75 font-mono text-xs leading-normal font-semibold tracking-tight whitespace-nowrap text-ink-muted"
        data-topic={props.post.frontmatter.topic}
      >
        {props.post.frontmatter.topic}
      </span>
      <span class="text-xl leading-tight font-bold text-ink sm:text-2xl">
        {props.post.frontmatter.title}
      </span>
      <span class="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-4 text-sm text-ink-muted">
        <span class="inline-flex min-w-0 items-center gap-2 wrap-anywhere">
          <Show when={props.post.frontmatter.pfp}>
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
          <span>{props.post.frontmatter.author}</span>
        </span>
        <time
          class="font-mono text-data tracking-tight text-ink-faint"
          datetime={props.post.frontmatter.publishedAt}
        >
          {formatDate(props.post.frontmatter.publishedAt)}
        </time>
      </span>
    </CardLink>
  );
}
