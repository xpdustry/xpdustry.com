import { useLocation } from "@tanstack/react-router";
import { T, useGT } from "gt-tanstack-start";
import { useId, useRef } from "react";
import { Brand } from "#app/components/site/Brand";
import { LocaleList, LocaleSwitch } from "#app/components/site/LocaleSwitch";
import { PlayPill } from "#app/components/site/PlayPill";
import {
  PlinthAnchor,
  PlinthButton,
  PlinthLink,
  PlinthSectionLink
} from "#app/components/ui/Plinth";
import type { PlayerCount } from "#app/data/live";
import { SITE } from "#app/data/site";
import { GitHub, List, X } from "#app/lib/icons";
import { moving, useShutPopovers } from "#app/lib/usePopovers";
import * as styles from "./Header.css";

const FOLDS = [styles.folded, styles.narrow];

/**
 * `players` feeds the address pill, shown where the page has no play card of its own.
 *
 * Where the navigation folds into a menu, the menu and the language list are popovers the browser
 * opens and shuts by itself, so they work before the page hydrates and without JavaScript.
 */
export function Header({ players }: { players: PlayerCount }) {
  const header = useRef<HTMLElement>(null);
  const menu = useId();
  const gt = useGT();
  const onLanding = useLocation({ select: (location) => location.pathname === "/" });
  useShutPopovers(header, FOLDS);

  return (
    <header ref={header} className={`${styles.header} reveal`}>
      <Brand className={styles.brand} />
      <PlinthButton
        tone="ink"
        icon
        className={styles.toggle}
        aria-label={gt("Menu")}
        popoverTarget={menu}
      >
        <List className={styles.whenShut} />
        <X className={styles.whenOpen} />
      </PlinthButton>
      <nav id={menu} popover="auto" className={styles.nav} aria-label={gt("Main")} {...moving}>
        <PlinthLink tone="ink" to="/" activeOptions={{ exact: true }}>
          <T>Home</T>
        </PlinthLink>
        <PlinthSectionLink tone="ink" hash="projects">
          <T>Projects</T>
        </PlinthSectionLink>
        <PlinthSectionLink tone="ink" hash="gamemodes">
          <T>Gamemodes</T>
        </PlinthSectionLink>
        <PlinthLink tone="ink" to="/blog" activeOptions={{ exact: true }}>
          <T>Blog</T>
        </PlinthLink>
        <PlinthAnchor tone="ink" href={SITE.maven}>
          Maven
        </PlinthAnchor>
        <LocaleList className={styles.languages} />
      </nav>
      {!onLanding && <PlayPill players={players} className={styles.play} />}
      <LocaleSwitch className={styles.language} />
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
