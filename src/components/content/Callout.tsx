import type { ParentProps } from "solid-js";
import * as styles from "#app/components/content/Callout.css";
import type { CalloutVariant } from "#app/components/content/Callout.css";

export type { CalloutVariant } from "#app/components/content/Callout.css";

export function Callout(props: ParentProps<{ variant?: CalloutVariant; label?: string }>) {
  const variant = () => props.variant ?? "note";

  return (
    <aside class={styles.callout[variant()]}>
      <span class={styles.calloutBadge[variant()]}>{props.label ?? "Note"}</span>
      {props.children}
    </aside>
  );
}
