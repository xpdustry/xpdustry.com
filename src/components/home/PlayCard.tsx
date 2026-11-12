import { CopyButton } from "#app/components/ui/CopyButton";
import { Patches } from "#app/components/ui/Patches";
import { PlayerCount } from "#app/components/ui/PlayerCount";
import type { PlayerCount as Count } from "#app/data/live";
import { PATCHES } from "#app/data/patches";
import { HUB } from "#app/data/servers";
import * as card from "#app/components/ui/Card.css";
import * as styles from "./PlayCard.css";

export function PlayCard({ players, className }: { players: Count; className?: string }) {
  const labels = HUB.hostname.split(".");
  return (
    <section id="servers" className={`${card.card} spot ${styles.play} ${className ?? ""}`}>
      <Patches patches={PATCHES.play} />
      <h2 className={styles.label}>Play with us</h2>
      <span className={styles.address}>
        {labels.slice(0, -2).join(".")}.<wbr />
        {labels.slice(-2).join(".")}
      </span>
      <span className={styles.how}>Paste it in Play › Join game › Add server</span>
      <span className={styles.row}>
        <PlayerCount count={players} className={styles.online} />
        <CopyButton text={HUB.hostname} label={`Copy ${HUB.hostname}`} className={styles.copy} />
      </span>
    </section>
  );
}
