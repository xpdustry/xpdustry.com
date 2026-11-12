import { PressableLogo } from "#app/components/home/PressableLogo";
import { GitHub } from "#app/components/ui/Icons";
import { Patches } from "#app/components/ui/Patches";
import { PlinthAnchor, PlinthLink } from "#app/components/ui/Plinth";
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
        We’re a small group of developers. Since 2019 we’ve made open source mods and plugins for
        Mindustry, and run servers for people to play on.
      </p>
      <div className={styles.actions}>
        <PlinthLink to="/" hash="projects">
          Browse projects
        </PlinthLink>
        <PlinthLink tone="amber" to="/" hash="gamemodes">
          Join a server
        </PlinthLink>
        <PlinthAnchor tone="ink" href={SITE.github}>
          <GitHub />
          GitHub
        </PlinthAnchor>
      </div>
    </section>
  );
}
