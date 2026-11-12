import { Brand } from "#app/components/site/Brand";
import { GitHub } from "#app/components/ui/Icons";
import { PlinthAnchor, PlinthLink } from "#app/components/ui/Plinth";
import { SITE } from "#app/data/site";
import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.header}>
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
