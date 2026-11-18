import { useGT, useLocale } from "gt-tanstack-start";
import type { RefCallback } from "react";
import { formatNumber } from "#app/i18n/format";
import type { PlayerCount as Count } from "#app/status/live";
import { PlayerCount } from "#app/status/PlayerCount";
import { HUB } from "#app/status/servers";
import { CopyButton } from "#app/ui/copy/CopyButton";
import type { CopyState } from "#app/ui/copy/useCopy";
import { Hostname } from "#app/ui/Hostname";
import { Check, Copy, X } from "#app/ui/icons";
import { play } from "#app/ui/viewTransition.css";
import * as styles from "./PlayPill.css";

const STATE_ICON = { idle: Copy, copied: Check, failed: X } satisfies Record<CopyState, unknown>;

export function PlayPill({ players, className }: { players: Count; className?: string }) {
  const gt = useGT();
  const locale = useLocale();
  const countLength = players.state === "online" ? formatNumber(players.players, locale).length : 0;
  const label =
    players.state === "online"
      ? gt("Copy IP {address}, {players} playing", {
          address: HUB.hostname,
          players: players.players
        })
      : `${gt("Copy IP {address}", { address: HUB.hostname })}, ${players.state === "polling" ? gt("Checking") : gt("Offline")}`;
  return (
    <span className={`${styles.slot} ${className ?? ""}`} data-count-length={countLength}>
      <CopyButton
        tone="amber"
        text={HUB.hostname}
        label={label}
        className={`${styles.pill} ${play}`}
      >
        {(state, address) => <Face players={players} state={state} address={address} />}
      </CopyButton>
    </span>
  );
}

function Face({
  players,
  state,
  address
}: {
  players: Count;
  state: CopyState;
  address: RefCallback<HTMLElement>;
}) {
  const Icon = STATE_ICON[state];
  if (state === "failed") {
    return (
      <>
        <span ref={address} className={styles.refused}>
          <Hostname name={HUB.hostname} />
        </span>
        <Icon />
      </>
    );
  }
  return (
    <>
      <PlayerCount count={players} compact className={styles.count} />
      <span className={styles.address}>
        <Hostname name={HUB.hostname} />
      </span>
      <span className={styles.brief}>IP</span>
      <Icon />
    </>
  );
}
