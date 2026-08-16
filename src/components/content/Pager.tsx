import { Show } from "solid-js";
import { CardLink } from "#app/components/system/Pressable";

export interface PagerEntry {
  href: string;
  title: string;
}

export interface PagerProps {
  label: string;
  previous?: PagerEntry;
  next?: PagerEntry;
  /** Wording differs between an article series and a docs section. */
  previousLabel?: string;
  nextLabel?: string;
}

/**
 * Previous/next navigation. With only a next link, it sits in the right column.
 *
 * One component for both the blog and the project pages, so a reader who
 * learns the control on a post already knows it on a docs page. The arrows
 * point outward from the pair, which is the direction each link travels.
 */
export function Pager(props: PagerProps) {
  return (
    <Show when={props.previous || props.next}>
      <nav
        class="mt-16 grid gap-4 border-t border-line-soft pt-8 sm:grid-cols-2"
        aria-label={props.label}
      >
        <Show when={props.previous}>
          {(entry) => (
            <CardLink
              faceClass="grid content-center gap-0.5 px-6 py-4 text-left"
              href={entry().href}
            >
              <span class="font-mono text-data tracking-tight text-ink-faint">
                {"<< "}
                {props.previousLabel ?? "Previous"}
              </span>
              <span class="font-bold text-ink">{entry().title}</span>
            </CardLink>
          )}
        </Show>
        <Show when={props.next}>
          {(entry) => (
            <CardLink
              class={!props.previous ? "sm:col-start-2" : undefined}
              faceClass="grid content-center gap-0.5 px-6 py-4 text-right"
              href={entry().href}
            >
              <span class="font-mono text-data tracking-tight text-ink-faint">
                {props.nextLabel ?? "Next"}
                {" >>"}
              </span>
              <span class="font-bold text-ink">{entry().title}</span>
            </CardLink>
          )}
        </Show>
      </nav>
    </Show>
  );
}
