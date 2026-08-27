import { Show } from "solid-js";
import { CopyButton } from "#app/components/system/CopyButton";
import { CopyIcon } from "#app/components/system/Icons";
import type { ServerSnapshotItem, SnapshotState } from "#app/data/snapshots";

/**
 * One Mindustry server.
 *
 * Every string in `info` came off a UDP packet, so all of it renders as text
 * nodes. The copy action always copies the friendly alias, never the address
 * the poller actually resolved and queried.
 */
export function ServerCard(props: {
  server: ServerSnapshotItem;
  state: SnapshotState;
  /** The tighter row the home page stacks in a column: no description. */
  compact?: boolean;
}) {
  const online = () => props.server.online;
  // Before the first poll a card is not offline, it is unknown. Saying
  // "Offline" then would be a claim the process cannot yet support.
  const pending = () => props.state === "loading";

  return (
    <li
      class={[
        "grid h-full content-start gap-3 rounded-2xl border-2 border-line bg-panel",
        props.compact ? "gap-2 p-4" : "p-6",
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
        <span class={props.compact ? "text-base font-bold" : "text-base font-bold sm:text-lg"}>
          {props.server.label}
        </span>
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

      {/* The compact card is a name, a state and a way in. What is on the map
          right now changes every wave and is not what the reader is choosing
          between, so it only appears on the full card. */}
      <Show when={!props.compact}>
        <div class="grid content-start gap-0.5">
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
                <span class="truncate font-mono text-data tracking-tight text-ink-faint tabular-nums">
                  {info().map}
                </span>
              </>
            )}
          </Show>
        </div>
      </Show>

      {/* One control: the address, with a copy glyph beside it. Pressing it
          copies and the whole face says so for a moment, which is the only
          feedback a copy has. */}
      <div class="mt-auto border-t border-line-soft pt-3">
        <CopyButton
          block
          faceClass="overflow-hidden px-3 font-mono font-medium tracking-tight"
          value={props.server.hostname}
          label={`Copy ${props.server.hostname}`}
          announcement={`Copied ${props.server.hostname}`}
        >
          <CopyIcon />
          <span class="min-w-0 truncate">{props.server.hostname}</span>
        </CopyButton>
      </div>
    </li>
  );
}

const badgeBase =
  "inline-flex items-center gap-2 rounded-sm border px-3 py-0.75 font-mono text-xs leading-normal font-semibold tracking-tight whitespace-nowrap";
const quietBadge = `${badgeBase} border-line-soft bg-page-sunk text-ink-muted`;
const accentBadge = `${badgeBase} border-accent-wall bg-accent text-on-accent`;
