import { CopyButton } from "#app/components/ui/CopyButton";
import { PlayerCount } from "#app/components/ui/PlayerCount";
import type { PlayerCount as Count } from "#app/data/live";
import { HUB } from "#app/data/servers";
import { Check, Copy } from "#app/lib/icons";
import * as styles from "./PlayPill.css";

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
