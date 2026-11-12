import type { ReactNode } from "react";
import { Discord } from "#app/components/ui/Icons";
import { Patches } from "#app/components/ui/Patches";
import { PATCHES } from "#app/data/patches";
import { SITE } from "#app/data/site";
import card from "#app/components/ui/Card.module.css";
import styles from "./AskCard.module.css";

/** A nudge to the Discord, for questions about what a page covers. */
export function AskCard({
  title,
  children,
  compact = false,
  className,
}: {
  title: string;
  children: ReactNode;
  /** The sidebar size: icon above a smaller title. */
  compact?: boolean;
  className?: string;
}) {
  return (
    <a
      href={SITE.discord}
      className={`${card.card} spot ${styles.ask} ${compact ? styles.compact : ""} ${className ?? ""}`}
    >
      <Patches patches={compact ? PATCHES.askCompact : PATCHES.ask} />
      <Discord className={styles.glyph} />
      <strong className={styles.title}>{title}</strong>
      <span className={styles.text}>{children}</span>
    </a>
  );
}
