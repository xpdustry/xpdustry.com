import { T } from "gt-tanstack-start";
import { PressableLogo } from "#app/components/home/PressableLogo";
import { Patches } from "#app/components/ui/Patches";
import { PlinthAnchor, PlinthSectionLink } from "#app/components/ui/Plinth";
import { PATCHES } from "#app/data/patches";
import { SITE } from "#app/data/site";
import { GitHub } from "#app/lib/icons";
import * as card from "#app/components/ui/Card.css";
import * as styles from "./Hero.css";

export function Hero({ className }: { className?: string }) {
  return (
    <section className={`${card.card} spot ${styles.hero} ${className ?? ""}`}>
      <Patches patches={PATCHES.hero} priority />
      <div className={styles.brand}>
        <PressableLogo className={styles.mark} />
        <h1>{SITE.name}</h1>
      </div>
      <p>
        <T>
          We’re a group of developers, making open source mods and plugins for Mindustry since 2019.
          We also run the Chaotic Neutral Mindustry servers.
        </T>
      </p>
      <div className={styles.actions}>
        <PlinthSectionLink hash="projects">
          <T>Browse projects</T>
        </PlinthSectionLink>
        <PlinthSectionLink tone="amber" hash="gamemodes">
          <T>Join a server</T>
        </PlinthSectionLink>
        <PlinthAnchor tone="ink" href={SITE.github}>
          <GitHub />
          GitHub
        </PlinthAnchor>
      </div>
    </section>
  );
}
