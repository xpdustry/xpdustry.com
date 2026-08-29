import { Show } from "solid-js";
import { CopyButton } from "#app/components/system/CopyButton";
import { CopyIcon } from "#app/components/system/Icons";
import type { ServerSnapshotItem } from "#app/data/snapshots";
import * as styles from "#app/components/content/ServerCard.css";
import { badge } from "#app/components/system/Badge.css";

export function ServerCard(props: { server: ServerSnapshotItem }) {
  const online = () => (props.server.status === "online" ? props.server : undefined);
  const polling = () => props.server.status === "polling";
  const cardState = (): styles.ServerCardState =>
    props.server.status === "offline" ? "offline" : "active";

  return (
    <li class={styles.card[cardState()]}>
      <div class={styles.heading}>
        <span class={styles.dot[props.server.status]} aria-hidden="true" />
        <span class={styles.label}>{props.server.label}</span>
        <span class={styles.status}>
          <Show
            when={online()}
            fallback={<span class={badge.quiet}>{polling() ? "Checking…" : "Offline"}</span>}
          >
            {(server) => (
              <span class={badge.accent}>
                {server().info.playerLimit > 0
                  ? `${server().info.players} / ${server().info.playerLimit}`
                  : `${server().info.players} online`}
              </span>
            )}
          </Show>
        </span>
      </div>

      <div class={styles.details}>
        <Show
          when={online()}
          fallback={
            <span class={styles.detail}>
              {polling() ? "Waiting for the first status poll" : "No response from this server"}
            </span>
          }
        >
          {(server) => <span class={styles.detail}>{server().info.map}</span>}
        </Show>
      </div>

      <div class={styles.copy}>
        <CopyButton
          block
          format="code"
          value={props.server.hostname}
          label={`Copy ${props.server.hostname}`}
          announcement={`Copied ${props.server.hostname}`}
        >
          <CopyIcon />
          <span class={styles.hostname}>{props.server.hostname}</span>
        </CopyButton>
      </div>
    </li>
  );
}
