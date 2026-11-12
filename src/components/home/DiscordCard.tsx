import { ArrowUpRight, Discord } from "#app/components/ui/Icons";
import { Texture } from "#app/components/ui/Texture";
import type { DiscordCounts } from "#app/data/live";
import { SITE } from "#app/data/site";
import { patches } from "#app/data/textures";
import card from "#app/components/ui/Card.module.css";
import styles from "./DiscordCard.module.css";

const TEXTURE = patches("#4652b5", "#4f5cc3", [
  [1, 0, 0.5, 1],
  [0, 1, 0.32, 1],
]);

const number = new Intl.NumberFormat("en-US");

export function DiscordCard({ counts, className }: { counts?: DiscordCounts; className?: string }) {
  return (
    <a href={SITE.discord} className={`${card.card} spot ${styles.discord} ${className ?? ""}`}>
      <Texture settings={TEXTURE} drift />
      <Discord className={styles.glyph} />
      <span className={styles.go}>
        <ArrowUpRight strokeWidth={2.4} />
      </span>
      <span>
        <strong className={styles.title}>Join our Discord</strong>
        <span className={styles.say}>Events, announcements and help all happen there.</span>
        {counts && (
          <small className={styles.counts}>
            {number.format(counts.online)} online, {number.format(counts.members)} members
          </small>
        )}
      </span>
    </a>
  );
}
