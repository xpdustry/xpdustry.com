import { T, useGT } from "gt-tanstack-start";
import { useCallback, useId, useRef, useState } from "react";
import { Brand } from "#app/components/site/Brand";
import { LocaleList, LocaleSwitch } from "#app/components/site/LocaleSwitch";
import { PlayPill } from "#app/components/site/PlayPill";
import {
  PlinthAnchor,
  PlinthButton,
  PlinthLink,
  PlinthSectionLink,
} from "#app/components/ui/Plinth";
import type { PlayerCount } from "#app/data/live";
import { SITE } from "#app/data/site";
import { GitHub, List, X } from "#app/lib/icons";
import { useDismiss } from "#app/lib/useDismiss";
import * as styles from "./Header.css";

export function Header({ players }: { players: PlayerCount }) {
  const [open, setOpen] = useState<"menu" | "languages">();
  const header = useRef<HTMLElement>(null);
  const menuToggle = useRef<HTMLButtonElement>(null);
  const languageToggle = useRef<HTMLButtonElement>(null);
  const menu = useId();
  const gt = useGT();

  const shut = useCallback(() => setOpen(undefined), []);
  const toggle = (popover: "menu" | "languages") => setOpen(open === popover ? undefined : popover);
  useDismiss({
    open: open !== undefined,
    within: header,
    returnTo: open === "languages" ? languageToggle : menuToggle,
    close: shut,
  });
  return (
    <header ref={header} className={`${styles.header} reveal`}>
      <Brand className={styles.brand} />
      <PlinthButton
        ref={menuToggle}
        tone="ink"
        icon
        className={styles.toggle}
        aria-label={gt("Menu")}
        aria-expanded={open === "menu"}
        aria-controls={menu}
        onClick={() => toggle("menu")}
      >
        {open === "menu" ? <X /> : <List />}
      </PlinthButton>
      <nav
        id={menu}
        className={`${styles.nav} ${open === "menu" ? styles.open : ""}`}
        aria-label={gt("Main")}
      >
        <PlinthLink tone="ink" to="/" activeOptions={{ exact: true }} onClick={shut}>
          <T>Home</T>
        </PlinthLink>
        <PlinthSectionLink tone="ink" hash="projects" onClick={shut}>
          <T>Projects</T>
        </PlinthSectionLink>
        <PlinthSectionLink tone="ink" hash="gamemodes" onClick={shut}>
          <T>Gamemodes</T>
        </PlinthSectionLink>
        <PlinthLink tone="ink" to="/blog" activeOptions={{ exact: true }} onClick={shut}>
          <T>Blog</T>
        </PlinthLink>
        <PlinthAnchor tone="ink" href={SITE.maven} onClick={shut}>
          Maven
        </PlinthAnchor>
        <LocaleList className={styles.languages} />
      </nav>
      <PlayPill players={players} className={styles.play} />
      <LocaleSwitch
        className={styles.language}
        button={languageToggle}
        open={open === "languages"}
        onToggle={() => toggle("languages")}
      />
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
