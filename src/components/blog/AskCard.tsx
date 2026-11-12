import type { ReactNode } from "react";
import { Discord } from "#app/components/ui/Icons";
import { Texture } from "#app/components/ui/Texture";
import { SITE } from "#app/data/site";
import { patches } from "#app/data/textures";
import card from "#app/components/ui/Card.module.css";
import styles from "./AskCard.module.css";

/** A nudge to the Discord, for questions about what a page covers. */
export function AskCard({
  title,
  children,
  spread = 0.62,
  drift = false,
  compact = false,
  className,
}: {
  title: string;
  children: ReactNode;
  /** How far the texture's patch reaches from the top-right corner. */
  spread?: number;
  drift?: boolean;
  /** The sidebar size: icon above a smaller title. */
  compact?: boolean;
  className?: string;
}) {
  return (
    <a
      href={SITE.discord}
      className={`${card.card} spot ${styles.ask} ${compact ? styles.compact : ""} ${className ?? ""}`}
    >
      <Texture settings={patches("#4652b5", "#4f5cc3", [[1, 0, spread, 1]])} drift={drift} />
      <Discord className={styles.glyph} />
      <strong className={styles.title}>{title}</strong>
      <span className={styles.text}>{children}</span>
    </a>
  );
}
