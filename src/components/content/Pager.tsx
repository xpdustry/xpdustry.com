import { Show } from "solid-js";
import { CardLink } from "#app/components/system/Pressable";
import * as styles from "#app/components/content/Pager.css";

export interface PagerEntry {
  href: string;
  title: string;
}

export interface PagerProps {
  label: string;
  previous?: PagerEntry;
  next?: PagerEntry;
  previousLabel?: string;
  nextLabel?: string;
}

export function Pager(props: PagerProps) {
  return (
    <Show when={props.previous || props.next}>
      <nav class={styles.pager} aria-label={props.label}>
        <Show when={props.previous}>
          {(entry) => (
            <CardLink faceClass={styles.face} href={entry().href}>
              <span class={styles.direction}>
                {"<< "}
                {props.previousLabel ?? "Previous"}
              </span>
              <span class={styles.title}>{entry().title}</span>
            </CardLink>
          )}
        </Show>
        <Show when={props.next}>
          {(entry) => (
            <CardLink class={styles.next} faceClass={styles.nextFace} href={entry().href}>
              <span class={styles.direction}>
                {props.nextLabel ?? "Next"}
                {" >>"}
              </span>
              <span class={styles.title}>{entry().title}</span>
            </CardLink>
          )}
        </Show>
      </nav>
    </Show>
  );
}
