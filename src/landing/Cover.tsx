import { T, useGT } from "gt-tanstack-start";
import { DiscordCard } from "#app/status/DiscordCard";
import { playerCount, type LiveData } from "#app/status/live";
import { Hero } from "./Hero";
import { PlayCard } from "./PlayCard";
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
        <T>Events, announcements and help all happen there.</T>
      </DiscordCard>
    </div>
  );
}
