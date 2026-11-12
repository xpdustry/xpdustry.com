import { Hero } from "#app/components/home/Hero";
import { PlayCard } from "#app/components/home/PlayCard";
import { DiscordCard } from "#app/components/site/DiscordCard";
import { playerCount, type LiveData } from "#app/data/live";
import * as styles from "./Cover.css";

export function Cover({ live }: { live: LiveData }) {
  return (
    <div className={styles.cover}>
      <Hero className={`${styles.hero} reveal`} />
      <PlayCard players={playerCount(live.servers.servers)} className={`${styles.side} reveal`} />
      <DiscordCard
        title="Join our Discord"
        counts={live.discord}
        className={`${styles.side} reveal`}
      >
        Events, announcements and help all happen there.
      </DiscordCard>
    </div>
  );
}
