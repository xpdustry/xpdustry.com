import { useGT } from "gt-tanstack-start";
import { Hero } from "#app/components/home/Hero";
import { PlayCard } from "#app/components/home/PlayCard";
import { DiscordCard } from "#app/components/site/DiscordCard";
import { playerCount, type LiveData } from "#app/data/live";
import * as styles from "./Cover.css";

export function Cover({ live }: { live: LiveData }) {
  const gt = useGT();
  return (
    <div className={styles.cover}>
      <Hero className={`${styles.hero} reveal`} />
      <PlayCard players={playerCount(live.servers.servers)} className={`${styles.side} reveal`} />
      <DiscordCard
        title={gt("Join our Discord")}
        counts={live.discord}
        className={`${styles.side} reveal`}
      >
        {gt("Events, announcements and help all happen there.")}
      </DiscordCard>
    </div>
  );
}
