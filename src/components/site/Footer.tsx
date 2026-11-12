import { useGT } from "gt-tanstack-start";
import { Brand } from "#app/components/site/Brand";
import { PlinthAnchor } from "#app/components/ui/Plinth";
import { SITE } from "#app/data/site";
import { ArrowUp } from "#app/lib/icons";
import * as styles from "./Footer.css";

export function Footer() {
  const gt = useGT();
  return (
    <footer className={`${styles.footer} reveal`}>
      <div className={styles.ridge} aria-hidden="true" />
      <div className={`wrap ${styles.inner}`}>
        <Brand className={styles.brand} />
        <nav className={styles.links} aria-label={gt("Elsewhere")}>
          <a href={SITE.github}>GitHub</a>
          <a href={SITE.discord}>Discord</a>
          <a href={SITE.maven}>Maven</a>
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </nav>
        <small className={styles.copyright}>© {new Date().getUTCFullYear()} Xpdustry</small>
        <PlinthAnchor className={styles.top} href="#top" aria-label={gt("Back to top")}>
          <ArrowUp />
          <span className={styles.say}>{gt("Back to top")}</span>
        </PlinthAnchor>
      </div>
    </footer>
  );
}
