import { T, useGT } from "gt-tanstack-start";
import { CopyStatus } from "#app/components/ui/CopyStatus";
import { Hostname } from "#app/components/ui/Hostname";
import { Patches } from "#app/components/ui/Patches";
import { PlayerCount } from "#app/components/ui/PlayerCount";
import type { PlayerCount as Count } from "#app/data/live";
import { PATCHES } from "#app/data/patches";
import { HUB } from "#app/data/servers";
import { Check, Copy, X } from "#app/lib/icons";
import { useCopy } from "#app/lib/useCopy";
import * as card from "#app/components/ui/Card.css";
import * as styles from "./PlayCard.css";

/** The hub's address. A press anywhere on the card copies it. */
export function PlayCard({ players, className }: { players: Count; className?: string }) {
  const gt = useGT();
  const { state, copy } = useCopy(HUB.hostname);
  const failed = state === "failed";
  return (
    <section
      id="servers"
      className={`${card.card} ${styles.play} ${failed ? styles.failed : ""} ${className ?? ""}`}
    >
      <button
        type="button"
        className={card.cover}
        aria-label={gt("Copy {address}", { address: HUB.hostname })}
        title={gt("Copy address")}
        onClick={copy}
      />
      <Patches patches={PATCHES.play} />
      <span
        className={`${card.hint} ${styles.hint} ${state === "idle" ? "" : card[state]}`}
        aria-hidden="true"
      >
        {state === "copied" ? <Check /> : failed ? <X /> : <Copy />}
      </span>
      <h2 className={styles.label}>
        <T>Play with us</T>
      </h2>
      <span className={styles.address}>
        <Hostname name={HUB.hostname} />
      </span>
      <span className={styles.how}>
        {failed ? (
          <T>Could not copy. Select the address to copy it yourself.</T>
        ) : (
          <T>Paste it in Play › Join game › Add server</T>
        )}
      </span>
      <PlayerCount count={players} className={styles.online} />
      <CopyStatus state={state} text={HUB.hostname} />
    </section>
  );
}
