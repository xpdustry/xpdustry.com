import { useLocation } from "@tanstack/react-router";
import { T, useGT } from "gt-tanstack-start";
import { useId, useRef } from "react";
import { Brand } from "#app/brand/Brand";
import { SITE } from "#app/brand/site";
import type { PlayerCount } from "#app/status/live";
import { GitHub, List, X } from "#app/ui/icons";
import { PlinthAnchor, PlinthButton, PlinthLink } from "#app/ui/Plinth";
import { animateOnToggle } from "#app/ui/popoverMotion";
import { LocaleList, LocaleSwitch } from "./LocaleSwitch";
import { PlayPill } from "./PlayPill";
import { useShutPopovers } from "./usePopovers";
import * as styles from "./Header.css";

export function Header({ players }: { players: PlayerCount }) {
  const header = useRef<HTMLElement>(null);
  const menu = useId();
  const gt = useGT();
  const pageHasPlayCard = useLocation({ select: (location) => location.pathname === "/" });
  useShutPopovers(header);

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
      <MainNav id={menu} />
      {!pageHasPlayCard && <PlayPill players={players} className={styles.play} />}
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

function MainNav({ id }: { id: string }) {
  const gt = useGT();
  return (
    <nav id={id} popover="auto" className={styles.nav} aria-label={gt("Main")} {...animateOnToggle}>
      <PlinthLink tone="ink" to="/" activeOptions={{ exact: true }}>
        <T>Home</T>
      </PlinthLink>
      <PlinthLink tone="ink" to="/blog" activeOptions={{ exact: true }}>
        <T>Blog</T>
      </PlinthLink>
      <LocaleList className={styles.languages} />
    </nav>
  );
}
