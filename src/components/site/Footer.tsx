import { Brand } from "#app/components/site/Brand";
import { ArrowUp } from "#app/components/ui/Icons";
import { PlinthAnchor } from "#app/components/ui/Plinth";
import { Texture } from "#app/components/ui/Texture";
import { SITE } from "#app/data/site";
import type { TextureSettings } from "#app/data/textures";
import styles from "./Footer.module.css";

// The footer's top edge: a ridge of uneven colonies that the deep teal grows out of.
const RIDGE: TextureSettings = {
  tile: 300,
  hard: 6,
  color: "#083230",
  blobs: [
    [0.04, 1.12, 0.95, 1],
    [0.23, 1.38, 0.72, 1],
    [0.44, 1.22, 0.82, 1],
    [0.64, 1.42, 0.66, 1],
    [0.83, 1.18, 0.9, 1],
    [1, 1.34, 0.74, 1],
  ],
  ramp: [0.45, 1.6],
};

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Texture settings={RIDGE} className={styles.ridge} />
      <div className={`wrap ${styles.inner}`}>
        <Brand className={styles.brand} />
        <nav className={styles.links} aria-label="Elsewhere">
          <a href={SITE.github}>GitHub</a>
          <a href={SITE.discord}>Discord</a>
          <a href={SITE.maven}>Maven</a>
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </nav>
        <small className={styles.copyright}>© {new Date().getUTCFullYear()} Xpdustry</small>
        <PlinthAnchor className={styles.top} href="#top" aria-label="Back to top">
          <ArrowUp />
          <span className={styles.say}>Back to top</span>
        </PlinthAnchor>
      </div>
    </footer>
  );
}
