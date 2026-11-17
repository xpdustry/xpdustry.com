import { useGT } from "gt-tanstack-start";
import type { RefCallback } from "react";
import type { PlayerCount as Count } from "#app/status/live";
import { PlayerCount } from "#app/status/PlayerCount";
import { HUB } from "#app/status/servers";
import { CopyButton } from "#app/ui/copy/CopyButton";
import type { CopyState } from "#app/ui/copy/useCopy";
import { Hostname } from "#app/ui/Hostname";
import { Check, Copy, X } from "#app/ui/icons";
import * as styles from "./PlayPill.css";

const STATE_ICON = { idle: Copy, copied: Check, failed: X } satisfies Record<CopyState, unknown>;

export function PlayPill({ players, className }: { players: Count; className?: string }) {
  const gt = useGT();
  const label =
    players.state === "online"
      ? gt("Copy IP {address}, {players} playing", {
          address: HUB.hostname,
          players: players.players
        })
      : `${gt("Copy IP {address}", { address: HUB.hostname })}, ${players.state === "polling" ? gt("Checking") : gt("Offline")}`;
  return (
    <CopyButton
      tone="amber"
      text={HUB.hostname}
      label={label}
      className={`${styles.pill} ${className ?? ""}`}
    >
      {(state, address) => <Face players={players} state={state} address={address} />}
    </CopyButton>
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
  return (
    <>
      <PlayerCount
        count={players}
        compact
        className={`${styles.count} ${state === "failed" ? styles.aside : ""}`}
      />
      <Address failed={state === "failed"} address={address} />
      <Icon />
    </>
  );
}

function Address({ failed, address }: { failed: boolean; address: RefCallback<HTMLElement> }) {
  if (failed) {
    return (
      <span ref={address} className={`${styles.address} ${styles.refused}`}>
        <Hostname name={HUB.hostname} />
      </span>
    );
  }
  return (
    <>
      <span className={styles.address}>{HUB.hostname}</span>
      <span className={styles.brief}>IP</span>
    </>
  );
}
