import { ArrowUpRight, Discord } from "#app/components/ui/Icons";
import { Patches } from "#app/components/ui/Patches";
import type { DiscordCounts } from "#app/data/live";
import { PATCHES } from "#app/data/patches";
import { SITE } from "#app/data/site";
import card from "#app/components/ui/Card.module.css";
import styles from "./DiscordCard.module.css";

const number = new Intl.NumberFormat("en-US");

export function DiscordCard({ counts, className }: { counts?: DiscordCounts; className?: string }) {
  return (
    <a href={SITE.discord} className={`${card.card} spot ${styles.discord} ${className ?? ""}`}>
      <Patches patches={PATCHES.discord} />
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
