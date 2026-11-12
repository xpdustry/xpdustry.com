import { useGT } from "gt-tanstack-start";
import { CopyButton } from "#app/components/ui/CopyButton";
import { PlayerCount } from "#app/components/ui/PlayerCount";
import type { PlayerCount as Count } from "#app/data/live";
import { HUB } from "#app/data/servers";
import { Check, Copy } from "#app/lib/icons";
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
      {(copied) => (
        <>
          <PlayerCount
            count={players}
            bare
            className={`${styles.count} ${players.state === "online" ? "" : styles.waiting}`}
          />
          <span className={styles.address}>{HUB.hostname}</span>
          <span className={styles.brief}>IP</span>
          {copied ? <Check /> : <Copy />}
        </>
      )}
    </CopyButton>
  );
}
