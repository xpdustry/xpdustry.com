import { useGT } from "gt-tanstack-start";
import type { PlayerCount as Count } from "#app/status/live";
import { PlayerCount } from "#app/status/PlayerCount";
import { HUB } from "#app/status/servers";
import { CopyButton } from "#app/ui/copy/CopyButton";
import { Hostname } from "#app/ui/Hostname";
import { Check, Copy, X } from "#app/ui/icons";
import * as styles from "./PlayPill.css";

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
      {(state) => (
        <>
          <PlayerCount
            count={players}
            bare
            className={`${styles.count} ${players.state === "online" ? "" : styles.waiting} ${state === "failed" ? styles.aside : ""}`}
          />
          {state === "failed" ? (
            <span className={`${styles.address} ${styles.failed}`}>
              <Hostname name={HUB.hostname} />
            </span>
          ) : (
            <>
              <span className={styles.address}>{HUB.hostname}</span>
              <span className={styles.brief}>IP</span>
            </>
          )}
          {state === "copied" ? <Check /> : state === "failed" ? <X /> : <Copy />}
        </>
      )}
    </CopyButton>
  );
}
