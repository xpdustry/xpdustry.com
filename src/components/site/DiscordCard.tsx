import type { ReactNode } from "react";
import { Patches } from "#app/components/ui/Patches";
import type { DiscordCounts } from "#app/data/live";
import { PATCHES } from "#app/data/patches";
import { SITE } from "#app/data/site";
import { ArrowUpRight, Discord } from "#app/lib/icons";
import * as card from "#app/components/ui/Card.css";
import * as styles from "./DiscordCard.css";

const number = new Intl.NumberFormat("en-US");

export function DiscordCard({
  title,
  children,
  counts,
  compact = false,
  className,
}: {
  title: string;
  children: ReactNode;
  /** Who is there right now, where the page knows. */
  counts?: DiscordCounts;
  /** The sidebar size. */
  compact?: boolean;
  className?: string;
}) {
  return (
    <a
      href={SITE.discord}
      className={`${card.card} spot ${styles.discord} ${compact ? styles.compact : ""} ${className ?? ""}`}
    >
      <Patches patches={compact ? PATCHES.discordCompact : PATCHES.discord} />
      <Discord className={styles.glyph} />
      <span className={styles.go}>
        <ArrowUpRight />
      </span>
      <span>
        <strong className={styles.title}>{title}</strong>
        <span className={styles.say}>{children}</span>
        {counts && (
          <small className={styles.counts}>
            {number.format(counts.online)} online, {number.format(counts.members)} members
          </small>
        )}
      </span>
    </a>
  );
}
