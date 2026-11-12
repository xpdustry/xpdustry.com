import { T, useGT } from "gt-tanstack-start";
import type { PlayerCount as Count } from "#app/status/live";
import { PlayerCount } from "#app/status/PlayerCount";
import { HUB } from "#app/status/servers";
import { PATCHES } from "#app/textures/cards";
import { Patches } from "#app/textures/Patches";
import { CopyStatus } from "#app/ui/copy/CopyStatus";
import { useCopy } from "#app/ui/copy/useCopy";
import { Hostname } from "#app/ui/Hostname";
import { Check, Copy, X } from "#app/ui/icons";
import * as card from "#app/ui/Card.css";
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
