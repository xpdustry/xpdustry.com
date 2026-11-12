import { T, useGT } from "gt-tanstack-start";
import { Patches } from "#app/components/ui/Patches";
import { PlayerCount } from "#app/components/ui/PlayerCount";
import type { PlayerCount as Count } from "#app/data/live";
import { PATCHES } from "#app/data/patches";
import { HUB } from "#app/data/servers";
import { Check, Copy } from "#app/lib/icons";
import { useCopy } from "#app/lib/useCopy";
import * as card from "#app/components/ui/Card.css";
import * as styles from "./PlayCard.css";

/** The hub's address. A press anywhere on the card copies it. */
export function PlayCard({ players, className }: { players: Count; className?: string }) {
  const gt = useGT();
  const { copied, copy } = useCopy(HUB.hostname);
  const labels = HUB.hostname.split(".");
  return (
    <section
      id="servers"
      className={`${card.card} spot ${styles.play} ${copied ? styles.copied : ""} ${className ?? ""}`}
    >
      <button
        type="button"
        className={card.cover}
        aria-label={gt("Copy {address}", { address: HUB.hostname })}
        title={gt("Copy address")}
        onClick={copy}
      />
      <Patches patches={PATCHES.play} />
      <span className={`${card.hint} ${styles.hint}`} aria-hidden="true">
        {copied ? <Check /> : <Copy />}
      </span>
      <h2 className={styles.label}>
        <T>Play with us</T>
      </h2>
      <span className={styles.address}>
        {labels.slice(0, -2).join(".")}.<wbr />
        {labels.slice(-2).join(".")}
      </span>
      <span className={styles.how}>
        <T>Paste it in Play › Join game › Add server</T>
      </span>
      <PlayerCount count={players} className={styles.online} />
      <output className="sr-only">
        {copied ? gt("Copied {text}", { text: HUB.hostname }) : ""}
      </output>
    </section>
  );
}
