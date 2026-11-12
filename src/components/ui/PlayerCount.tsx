import type { ReactNode } from "react";
import { Online } from "#app/components/ui/Online";
import type { PlayerCount as Count } from "#app/data/live";

const number = new Intl.NumberFormat("en-US");

/** "31 online" with a green light, or a grey one while the servers are being checked or are down. */
export function PlayerCount({
  count,
  className,
  unit = " online",
}: {
  count: Count;
  className?: string;
  /** Follows the number; hide it visually with a span of your own if the space is tight. */
  unit?: ReactNode | ((players: number) => ReactNode);
}) {
  if (count.state === "online") {
    return (
      <Online className={className}>
        <span>
          {number.format(count.players)}
          {typeof unit === "function" ? unit(count.players) : unit}
        </span>
      </Online>
    );
  }
  return (
    <Online offline className={className}>
      {count.state === "polling" ? "Checking" : "Offline"}
    </Online>
  );
}
