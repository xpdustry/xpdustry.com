import { SITE } from "#app/data/site";
import * as styles from "#app/components/layout/SiteFooter.css";

export function SiteFooter() {
  return (
    <footer class={styles.footer}>
      <div class={styles.footerLayout}>
        <div class={styles.identity}>
          <a class={styles.brand} href="/" aria-label={`${SITE.name} home`}>
            <span class={styles.logo} aria-hidden="true" />
            <span class={styles.brandName}>{SITE.name}</span>
          </a>
          <small class={styles.copyright}>© 2026 {SITE.name}</small>
        </div>

        <div class={styles.navigation}>
          <div class={styles.linkGroup}>
            <h2 class={styles.heading}>Site</h2>
            <a class={styles.link} href="/">
              Home
            </a>
            <a class={styles.link} href="/blog">
              Blog
            </a>
          </div>
          <div class={styles.linkGroup}>
            <h2 class={styles.heading}>Contact</h2>
            <a class={styles.link} href={SITE.discord} target="_blank" rel="noreferrer">
              Discord
            </a>
            <a class={styles.link} href={SITE.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a class={styles.link} href={`mailto:${SITE.email}`}>
              {SITE.email}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
