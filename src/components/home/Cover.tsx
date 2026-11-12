import { DiscordCard } from "#app/components/home/DiscordCard";
import { Hero } from "#app/components/home/Hero";
import { PlayCard } from "#app/components/home/PlayCard";
import { playerCount, type LiveData } from "#app/data/live";
import styles from "./Cover.module.css";

/** The top of the home page: who we are, where to play, where to talk. */
export function Cover({ live }: { live: LiveData }) {
  return (
    <div className={styles.cover}>
      <Hero className={styles.hero} />
      <PlayCard players={playerCount(live.servers.servers)} className={styles.play} />
      <DiscordCard counts={live.discord} className={styles.discord} />
    </div>
  );
}
