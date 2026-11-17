import { T } from "gt-tanstack-start";
import { useEffect, useRef, useState } from "react";
import { SITE } from "#app/brand/site";
import { PATCHES, SPREADS } from "#app/textures/cards";
import { Patches } from "#app/textures/Patches";
import { Spread, spreadFromPress, type SpreadStart } from "#app/textures/Spread";
import { COPIED_MS } from "#app/ui/copy/useCopy";
import { GitHub } from "#app/ui/icons";
import { PlinthAnchor, PlinthSectionLink } from "#app/ui/Plinth";
import { PressableLogo } from "./logo/PressableLogo";
import { useSeen } from "./useSeen";
import * as card from "#app/ui/Card.css";
import * as styles from "./Hero.css";

export function Hero({ className }: { className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const seen = useSeen(ref);
  const [spread, setSpread] = useState<SpreadStart>();
  const [on, setOn] = useState(false);

  // A press holds the spread on as long as a copied gamemode card holds its own.
  useEffect(() => {
    if (!spread) return;
    const timer = setTimeout(() => setOn(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [spread]);

  return (
    <section ref={ref} className={`${card.card} ${styles.hero} ${className ?? ""}`}>
      <Patches patches={PATCHES.hero} />
      <Spread palette={seen ? SPREADS.hero : undefined} on={on} from={spread} />
      <div className={styles.brand}>
        <PressableLogo
          className={styles.mark}
          onClick={(event) => {
            const box = ref.current!.getBoundingClientRect();
            setSpread(spreadFromPress(event, box, event.currentTarget.getBoundingClientRect()));
            setOn(true);
          }}
        />
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
