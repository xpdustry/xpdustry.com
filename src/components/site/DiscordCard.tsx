import type { ReactNode } from "react";
import { ArrowUpRight, Discord } from "#app/components/ui/Icons";
import { Patches } from "#app/components/ui/Patches";
import type { DiscordCounts } from "#app/data/live";
import { PATCHES } from "#app/data/patches";
import { SITE } from "#app/data/site";
import card from "#app/components/ui/Card.module.css";
import styles from "./DiscordCard.module.css";

const number = new Intl.NumberFormat("en-US");

/** The way into the Discord: the same card on every page, saying what that page sends you there for. */
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
        <ArrowUpRight strokeWidth={2.4} />
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
