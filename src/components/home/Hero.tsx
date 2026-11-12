import { PressableLogo } from "#app/components/home/PressableLogo";
import { GitHub } from "#app/components/ui/Icons";
import { PlinthAnchor, PlinthLink } from "#app/components/ui/Plinth";
import { Texture } from "#app/components/ui/Texture";
import { SITE } from "#app/data/site";
import { patches } from "#app/data/textures";
import card from "#app/components/ui/Card.module.css";
import styles from "./Hero.module.css";

const TEXTURE = patches("#86d8cf", "#a6e7e0", [
  [0.86, 0.82, 0.46, 1],
  [0.56, 0.07, 0.12, 1],
  [0.02, 1, 0.17, 1],
]);

export function Hero({ className }: { className?: string }) {
  return (
    <section className={`${card.card} spot ${styles.hero} ${className ?? ""}`}>
      <Texture settings={TEXTURE} drift />
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
