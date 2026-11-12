import { useGT, useLocale } from "gt-tanstack-start";
import type { ReactNode } from "react";
import { SITE } from "#app/brand/site";
import { formatNumber } from "#app/i18n/format";
import { PATCHES } from "#app/textures/cards";
import { Patches } from "#app/textures/Patches";
import { ArrowUpRight, Discord } from "#app/ui/icons";
import type { DiscordCounts } from "./live";
import * as card from "#app/ui/Card.css";
import * as styles from "./DiscordCard.css";

/** The card's two sizes: the compact one sits in a narrow column, under smaller patches. */
const SIZES = {
  regular: { className: "", patches: PATCHES.discord },
  compact: { className: styles.compact, patches: PATCHES.discordCompact }
};

export function DiscordCard({
  title,
  children,
  counts,
  compact = false,
  className = ""
}: {
  title: string;
  children: ReactNode;
  /** Who is there right now, where the page knows. */
  counts?: DiscordCounts;
  compact?: boolean;
  className?: string;
}) {
  const size = SIZES[compact ? "compact" : "regular"];
  return (
    <a
      href={SITE.discord}
      className={`${card.card} ${styles.discord} ${size.className} ${className}`}
    >
      <Patches patches={size.patches} />
      <Discord className={styles.glyph} />
      <span className={`${card.hint} ${styles.go}`}>
        <ArrowUpRight />
      </span>
      <span>
        <strong className={styles.title}>{title}</strong>
        <span className={styles.say}>{children}</span>
        {counts && <Presence counts={counts} />}
      </span>
    </a>
  );
}

function Presence({ counts }: { counts: DiscordCounts }) {
  const gt = useGT();
  const locale = useLocale();
  return (
    <small className={styles.counts}>
      {gt("{online} online, {members} members", {
        online: formatNumber(counts.online, locale),
        members: formatNumber(counts.members, locale)
      })}
    </small>
  );
}
