import { T, useGT } from "gt-tanstack-start";
import type { PlayerCount as Count } from "#app/status/live";
import { PlayerCount } from "#app/status/PlayerCount";
import { HUB } from "#app/status/servers";
import { PATCHES } from "#app/textures/cards";
import { Patches } from "#app/textures/Patches";
import { CopyCard } from "#app/ui/copy/CopyCard";
import { useCopy, type CopyState } from "#app/ui/copy/useCopy";
import { Hostname } from "#app/ui/Hostname";
import { Check, Copy, X, type Icon } from "#app/ui/icons";
import * as card from "#app/ui/Card.css";
import * as styles from "./PlayCard.css";

/** The hub's address. A press anywhere on the card copies it. */
export function PlayCard({ players, className }: { players: Count; className?: string }) {
  const gt = useGT();
  const { state, copy } = useCopy(HUB.hostname);
  const failed = state === "failed";
  return (
    <CopyCard
      as="section"
      id="servers"
      className={`${styles.play} ${failed ? styles.failed : ""} ${className ?? ""}`}
      text={HUB.hostname}
      state={state}
      cover={{
        "aria-label": gt("Copy {address}", { address: HUB.hostname }),
        title: gt("Copy address"),
        onClick: copy
      }}
    >
      <Patches patches={PATCHES.play} />
      <Hint state={state} />
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
    </CopyCard>
  );
}

const HINTS: Record<CopyState, { icon: Icon; className: string }> = {
  idle: { icon: Copy, className: "" },
  copied: { icon: Check, className: card.copied },
  failed: { icon: X, className: card.failed }
};

/** The chip in the corner: what a press does, then how it went. */
function Hint({ state }: { state: CopyState }) {
  const { icon: Glyph, className } = HINTS[state];
  return (
    <span className={`${card.hint} ${styles.hint} ${className}`} aria-hidden="true">
      <Glyph />
    </span>
  );
}
