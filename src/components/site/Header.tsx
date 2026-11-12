import { Brand } from "#app/components/site/Brand";
import { PlayPill } from "#app/components/site/PlayPill";
import { GitHub } from "#app/components/ui/Icons";
import { PlinthAnchor, PlinthLink } from "#app/components/ui/Plinth";
import type { PlayerCount } from "#app/data/live";
import { SITE } from "#app/data/site";
import styles from "./Header.module.css";

export function Header({ players }: { players: PlayerCount }) {
  return (
    <header className={`${styles.header} reveal`}>
      <Brand />
      <nav className={styles.nav} aria-label="Main">
        <PlinthLink tone="ink" to="/" activeOptions={{ exact: true }}>
          Home
        </PlinthLink>
        <PlinthLink tone="ink" to="/" hash="projects">
          Projects
        </PlinthLink>
        <PlinthLink tone="ink" to="/" hash="gamemodes">
          Gamemodes
        </PlinthLink>
        <PlinthLink tone="ink" to="/blog">
          Blog
        </PlinthLink>
        <PlinthAnchor tone="ink" href={SITE.maven}>
          Maven
        </PlinthAnchor>
      </nav>
      <PlayPill players={players} className={styles.play} />
      <PlinthAnchor
        tone="ink"
        icon
        className={styles.github}
        href={SITE.github}
        aria-label="GitHub"
      >
        <GitHub />
      </PlinthAnchor>
    </header>
  );
}
