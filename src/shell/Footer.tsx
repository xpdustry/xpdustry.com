import { T, useGT } from "gt-tanstack-start";
import { useEffect, useState } from "react";
import { Brand } from "#app/brand/Brand";
import { SITE } from "#app/brand/site";
import { ArrowUp } from "#app/ui/icons";
import { outbound } from "#app/ui/outbound";
import { PlinthAnchor } from "#app/ui/Plinth";
import * as styles from "./Footer.css";

export function Footer() {
  const gt = useGT();
  const scrollable = usePageOverflows();
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
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </nav>
        <small className={styles.copyright}>© {import.meta.env.BUILD_YEAR} Xpdustry</small>
        <PlinthAnchor
          className={styles.top}
          href="#top"
          aria-label={gt("Back to top")}
          aria-hidden={!scrollable}
          tabIndex={scrollable ? undefined : -1}
          style={{ visibility: scrollable ? "visible" : "hidden" }}
        >
          <ArrowUp />
          <span className={styles.say}>
            <T>Back to top</T>
          </span>
        </PlinthAnchor>
      </div>
    </footer>
  );
}

function usePageOverflows() {
  const [scrollable, setScrollable] = useState(false);
  useEffect(() => {
    const measure = () => {
      const untransformedPageHeight = document.body.offsetHeight;
      setScrollable(untransformedPageHeight > document.documentElement.clientHeight);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(document.documentElement);
    observer.observe(document.body);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  return scrollable;
}
