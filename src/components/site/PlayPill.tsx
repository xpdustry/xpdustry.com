import { CopyButton } from "#app/components/ui/CopyButton";
import { Check, Copy } from "#app/components/ui/Icons";
import { PlayerCount } from "#app/components/ui/PlayerCount";
import type { PlayerCount as Count } from "#app/data/live";
import { HUB } from "#app/data/servers";
import styles from "./PlayPill.module.css";

/** The hub's address on every page, with how many are playing there; a press copies it. */
export function PlayPill({ players, className }: { players: Count; className?: string }) {
  const playing = players.state === "online" ? `, ${players.players} playing` : "";
  return (
    <CopyButton
      tone="amber"
      text={HUB.hostname}
      label={`Copy ${HUB.hostname}${playing}`}
      className={`${styles.pill} ${className ?? ""}`}
    >
      {(copied) => (
        <>
          <PlayerCount
            count={players}
            unit=""
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
