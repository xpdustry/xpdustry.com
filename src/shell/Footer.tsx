import { T, useGT } from "gt-tanstack-start";
import { Brand } from "#app/brand/Brand";
import { SITE } from "#app/brand/site";
import { ArrowUp } from "#app/ui/icons";
import { outbound } from "#app/ui/outbound";
import { PlinthAnchor } from "#app/ui/Plinth";
import * as styles from "./Footer.css";

export function Footer() {
  const gt = useGT();
  return (
    <footer className={`${styles.footer} reveal`}>
      <div className={styles.ridge} aria-hidden="true" />
      <div className={`wrap ${styles.inner}`}>
        <Brand className={styles.brand} />
        <nav className={styles.links} aria-label={gt("Elsewhere")}>
          <a href={SITE.github} {...outbound(SITE.github)}>
            GitHub
          </a>
          <a href={SITE.discord} {...outbound(SITE.discord)}>
            Discord
          </a>
          <a href={SITE.maven} {...outbound(SITE.maven)}>
            Maven
          </a>
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </nav>
        <small className={styles.copyright}>© {new Date().getUTCFullYear()} Xpdustry</small>
        <PlinthAnchor className={styles.top} href="#top" aria-label={gt("Back to top")}>
          <ArrowUp />
          <span className={styles.say}>
            <T>Back to top</T>
          </span>
        </PlinthAnchor>
      </div>
    </footer>
  );
}
