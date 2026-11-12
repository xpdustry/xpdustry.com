import { useGT } from "gt-tanstack-start";
import { Online } from "#app/components/ui/Online";
import type { PlayerCount as Count } from "#app/data/live";

const number = new Intl.NumberFormat("en-US");

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
  if (count.state === "online") {
    return (
      <Online className={className}>
        <span>
          {bare
            ? number.format(count.players)
            : gt("{players} online", { players: number.format(count.players) })}
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
