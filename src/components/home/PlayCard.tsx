import { CopyButton } from "#app/components/ui/CopyButton";
import { PlayerCount } from "#app/components/ui/PlayerCount";
import { Texture } from "#app/components/ui/Texture";
import type { PlayerCount as Count } from "#app/data/live";
import { HUB } from "#app/data/servers";
import { patches } from "#app/data/textures";
import card from "#app/components/ui/Card.module.css";
import styles from "./PlayCard.module.css";

const TEXTURE = patches("#f7d08c", "#fbdfab", [
  [0.97, 0.05, 0.42, 1],
  [0.66, 1, 0.16, 1],
]);

/** The hub's address, to paste into the game, and how many are playing across the servers. */
export function PlayCard({ players, className }: { players: Count; className?: string }) {
  // a narrow card may wrap the address, but only before the site's own domain
  const labels = HUB.hostname.split(".");
  return (
    <section id="servers" className={`${card.card} spot ${styles.play} ${className ?? ""}`}>
      <Texture settings={TEXTURE} drift />
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
