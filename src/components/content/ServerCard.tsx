import { Show } from "solid-js";
import { CopyButton } from "#app/components/system/CopyButton";
import { CopyIcon } from "#app/components/system/Icons";
import { ButtonLink } from "#app/components/system/Pressable";
import type { ServerSnapshotItem, SnapshotState } from "#app/data/snapshots";

/**
 * One Mindustry server.
 *
 * Every string in `info` came off a UDP packet, so all of it renders as text
 * nodes. The copy action always copies the friendly alias, never the address
 * the poller actually resolved and queried.
 */
export function ServerCard(props: { server: ServerSnapshotItem; state: SnapshotState }) {
  const online = () => props.server.online;
  // Before the first poll a card is not offline, it is unknown. Saying
  // "Offline" then would be a claim the process cannot yet support.
  const pending = () => props.state === "loading";

  return (
    <li
      class={[
        "grid h-full content-start gap-3 rounded-2xl border-2 border-line bg-panel p-6",
        { "border-line-soft bg-panel-sunk": !online() && !pending() },
      ]}
    >
      <div class="flex items-center gap-3">
        <span
          class={[
            "size-2.5 shrink-0 rounded-full border-2 border-line bg-accent",
            online() ? "dot--live" : pending() ? "bg-signal" : "bg-danger",
          ]}
        />
        <span class="text-base font-bold sm:text-lg">{props.server.label}</span>
        <span class="ml-auto">
          <Show
            when={online() && props.server.info}
            fallback={<span class={quietBadge}>{pending() ? "Checking…" : "Offline"}</span>}
          >
            {(info) => (
              // Mindustry reports 0 for "no limit", which would otherwise
              // render as "3 / 0".
              <span class={accentBadge}>
                {info().playerLimit > 0
                  ? `${info().players} / ${info().playerLimit}`
                  : `${info().players} online`}
              </span>
            )}
          </Show>
        </span>
      </div>

      <div class="grid min-h-11 content-start gap-0.5">
        <Show
          when={online() && props.server.info}
          fallback={
            <span class="truncate font-mono text-data tracking-tight text-ink-faint tabular-nums">
              {pending() ? "Waiting for the first status poll" : "No response from this server"}
            </span>
          }
        >
          {(info) => (
            <>
              {/* No game mode: the server's own name already carries it. */}
              <span class="truncate font-mono text-data tracking-tight text-ink-faint tabular-nums">
                {info().map} · wave {info().wave}
              </span>
              <Show when={info().description !== ""}>
                <span class="line-clamp-2 text-sm text-ink-muted">{info().description}</span>
              </Show>
            </>
          )}
        </Show>
      </div>

      {/* Two ways in, side by side. Mindustry registers the mindustry://
          scheme, so the address itself can be the join button for anyone with
          the game installed; the square beside it copies the address for
          everyone else, and for pasting to a friend. */}
      <div class="mt-auto flex flex-wrap items-center gap-3 border-t border-line-soft pt-3">
        <CopyButton
          icon
          class="shrink-0"
          value={props.server.hostname}
          label={`Copy ${props.server.hostname}`}
          announcement={`Copied ${props.server.hostname}`}
        >
          <CopyIcon />
        </CopyButton>
        <ButtonLink
          class="block min-w-0 flex-1"
          faceClass="overflow-hidden px-3 font-mono font-medium tracking-tight"
          size="sm"
          href={`mindustry://${props.server.hostname}`}
          title={`Join ${props.server.label} in Mindustry`}
        >
          {props.server.hostname}
        </ButtonLink>
      </div>
    </li>
  );
}

const badgeBase =
  "inline-flex items-center gap-2 rounded-sm border px-3 py-0.75 font-mono text-xs leading-normal font-semibold tracking-tight whitespace-nowrap";
const quietBadge = `${badgeBase} border-line-soft bg-page-sunk text-ink-muted`;
const accentBadge = `${badgeBase} border-accent-wall bg-accent text-on-accent`;
