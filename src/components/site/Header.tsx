import { useEffect, useId, useRef, useState } from "react";
import { Brand } from "#app/components/site/Brand";
import { PlayPill } from "#app/components/site/PlayPill";
import { GitHub, List, X } from "#app/lib/icons";
import {
  PlinthAnchor,
  PlinthButton,
  PlinthLink,
  PlinthSectionLink,
} from "#app/components/ui/Plinth";
import type { PlayerCount } from "#app/data/live";
import { SITE } from "#app/data/site";
import * as styles from "./Header.css";

/**
 * Wide, the pages in a row beside the brand; narrower, behind a menu button, in a panel that
 * shuts on a link, on Escape and on a press anywhere else.
 */
export function Header({ players }: { players: PlayerCount }) {
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const menu = useId();

  useEffect(() => {
    if (!open) return;
    const inside = (node: unknown) => header.current?.contains(node as Node) ?? false;
    const shut = (event: KeyboardEvent | PointerEvent) => {
      if (event instanceof KeyboardEvent) {
        if (event.key !== "Escape") return;
        // focus does not stay behind on a link that is no longer there
        if (inside(document.activeElement)) toggle.current?.focus();
      } else if (inside(event.target)) return;
      setOpen(false);
    };
    addEventListener("keydown", shut);
    addEventListener("pointerdown", shut);
    return () => {
      removeEventListener("keydown", shut);
      removeEventListener("pointerdown", shut);
    };
  }, [open]);

  const shut = () => setOpen(false);
  return (
    <header ref={header} className={`${styles.header} reveal`}>
      <Brand className={styles.brand} />
      {/* before the pages, so Tab goes from it into them; it sits last by `order` */}
      <PlinthButton
        ref={toggle}
        tone="ink"
        icon
        className={styles.toggle}
        aria-label="Menu"
        aria-expanded={open}
        aria-controls={menu}
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <List />}
      </PlinthButton>
      <nav id={menu} className={`${styles.nav} ${open ? styles.open : ""}`} aria-label="Main">
        <PlinthLink tone="ink" to="/" activeOptions={{ exact: true }} onClick={shut}>
          Home
        </PlinthLink>
        <PlinthSectionLink tone="ink" hash="projects" onClick={shut}>
          Projects
        </PlinthSectionLink>
        <PlinthSectionLink tone="ink" hash="gamemodes" onClick={shut}>
          Gamemodes
        </PlinthSectionLink>
        <PlinthLink tone="ink" to="/blog" activeOptions={{ exact: true }} onClick={shut}>
          Blog
        </PlinthLink>
        <PlinthAnchor tone="ink" href={SITE.maven} onClick={shut}>
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
