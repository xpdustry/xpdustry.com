import { useGT, useLocale } from "gt-tanstack-start";
import { Online } from "#app/components/ui/Online";
import type { PlayerCount as Count } from "#app/data/live";
import { formatNumber } from "#app/lib/format";

/** "31 online" with a green light, or a grey one while the servers are being checked or are down. */
export function PlayerCount({
  count,
  className,
  bare = false,
}: {
  count: Count;
  className?: string;
  /** The number alone, without "online" after it. */
  bare?: boolean;
}) {
  const gt = useGT();
  const locale = useLocale();
  if (count.state === "online") {
    return (
      <Online className={className}>
        <span>
          {bare
            ? formatNumber(count.players, locale)
            : gt("{players} online", { players: formatNumber(count.players, locale) })}
        </span>
      </Online>
    );
  }
  return (
    <Online offline className={className}>
      {count.state === "polling" ? gt("Checking") : gt("Offline")}
    </Online>
  );
}
