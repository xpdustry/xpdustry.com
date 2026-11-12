import { PressableLogo } from "#app/components/home/PressableLogo";
import { GitHub } from "#app/components/ui/Icons";
import { Patches } from "#app/components/ui/Patches";
import { PlinthAnchor, PlinthSectionLink } from "#app/components/ui/Plinth";
import { PATCHES } from "#app/data/patches";
import { SITE } from "#app/data/site";
import card from "#app/components/ui/Card.module.css";
import styles from "./Hero.module.css";

export function Hero({ className }: { className?: string }) {
  return (
    <section className={`${card.card} spot ${styles.hero} ${className ?? ""}`}>
      <Patches patches={PATCHES.hero} />
      <div className={styles.brand}>
        <PressableLogo className={styles.mark} />
        <h1>{SITE.name}</h1>
      </div>
      <p>
        We’re a group of developers, making open source mods and plugins for Mindustry since 2019.
        We also run the Chaotic Neutral Mindustry servers.
      </p>
      <div className={styles.actions}>
        <PlinthSectionLink hash="projects">Browse projects</PlinthSectionLink>
        <PlinthSectionLink tone="amber" hash="gamemodes">
          Join a server
        </PlinthSectionLink>
        <PlinthAnchor tone="ink" href={SITE.github}>
          <GitHub />
          GitHub
        </PlinthAnchor>
      </div>
    </section>
  );
}
