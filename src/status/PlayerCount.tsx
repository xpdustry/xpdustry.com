import { useGT, useLocale } from "gt-tanstack-start";
import { formatNumber } from "#app/i18n/format";
import { Spinner, X } from "#app/ui/icons";
import type { PlayerCount as Count } from "./live";
import { Online } from "./Online";
import * as styles from "./PlayerCount.css";

export function PlayerCount({
  count,
  className,
  compact = false
}: {
  count: Count;
  className?: string;
  compact?: boolean;
}) {
  const gt = useGT();
  const locale = useLocale();
  if (count.state === "online") {
    return (
      <Online className={className}>
        <span>
          {compact
            ? formatNumber(count.players, locale)
            : gt("{players} online", { players: formatNumber(count.players, locale) })}
        </span>
      </Online>
    );
  }
  return <UnavailableCount count={count} compact={compact} className={className} />;
}

function UnavailableCount({
  count,
  compact,
  className
}: {
  count: Exclude<Count, { state: "online" }>;
  compact: boolean;
  className: string | undefined;
}) {
  const gt = useGT();
  const status = count.state === "polling" ? gt("Checking") : gt("Offline");
  if (compact) {
    return (
      <span className={[styles.status, className].filter(Boolean).join(" ")} title={status}>
        <span className="sr-only">{status}</span>
        {count.state === "polling" ? <Spinner className={styles.spinner} /> : <X />}
      </span>
    );
  }
  return (
    <Online offline className={className}>
      {status}
    </Online>
  );
}
