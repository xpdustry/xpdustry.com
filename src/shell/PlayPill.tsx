import { useGT } from "gt-tanstack-start";
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
      ? gt("Copy {address}, {players} playing", { address: HUB.hostname, players: players.players })
      : gt("Copy {address}", { address: HUB.hostname });
  return (
    <CopyButton
      tone="amber"
      text={HUB.hostname}
      label={label}
      className={`${styles.pill} ${className ?? ""}`}
    >
      {(state) => <Face players={players} state={state} />}
    </CopyButton>
  );
}

/** The players online, the hub's address and an icon saying whether the copy landed. */
function Face({ players, state }: { players: Count; state: CopyState }) {
  const Icon = STATE_ICON[state];
  return (
    <>
      <PlayerCount
        count={players}
        bare
        className={`${styles.count} ${players.state === "online" ? "" : styles.waiting} ${state === "failed" ? styles.aside : ""}`}
      />
      <Address failed={state === "failed"} />
      <Icon />
    </>
  );
}

/** After a refused copy the address shows at every width, ready to be selected by hand. */
function Address({ failed }: { failed: boolean }) {
  if (failed) {
    return (
      <span className={`${styles.address} ${styles.failed}`}>
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
