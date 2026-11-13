import { T, useGT } from "gt-tanstack-start";
import type { Ref } from "react";
import type { PlayerCount as Count } from "#app/status/live";
import { PlayerCount } from "#app/status/PlayerCount";
import { HUB } from "#app/status/servers";
import { PATCHES, SPREADS } from "#app/textures/cards";
import { Patches } from "#app/textures/Patches";
import { Spread } from "#app/textures/Spread";
import { CopyCard } from "#app/ui/copy/CopyCard";
import { Roll } from "#app/ui/copy/Roll";
import type { CopyState } from "#app/ui/copy/useCopy";
import { Hostname } from "#app/ui/Hostname";
import { Check, Copy, X } from "#app/ui/icons";
import { useCopyPress } from "./useCopyPress";
import { useSeen } from "./useSeen";
import * as card from "#app/ui/Card.css";
import * as styles from "./PlayCard.css";

/** The hub's address. A press anywhere on the card copies it, in a spread of the card's colour. */
export function PlayCard({ players, className }: { players: Count; className?: string }) {
  const gt = useGT();
  const { state, spread, chip, press } = useCopyPress(HUB.hostname);
  const seen = useSeen(chip);
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
        onClick: press
      }}
    >
      <Patches patches={PATCHES.play} />
      <Spread tiles={seen ? SPREADS.play : undefined} on={state === "copied"} from={spread} />
      <Hint ref={chip} state={state} />
      <h2 className={styles.label}>
        <T>Play with us</T>
      </h2>
      <span className={styles.address}>
        <Hostname name={HUB.hostname} />
      </span>
      <How failed={failed} />
      <span className={styles.foot}>
        <Roll rolled={state === "copied"} said={gt("Copied")}>
          <PlayerCount count={players} className={styles.online} />
        </Roll>
      </span>
    </CopyCard>
  );
}

/** Where to paste the address, or, when the copy failed, to select it instead. */
function How({ failed }: { failed: boolean }) {
  return (
    <span className={styles.how}>
      {failed ? (
        <T>Could not copy. Select the address to copy it yourself.</T>
      ) : (
        <T>Paste it in Play › Join game › Add server</T>
      )}
    </span>
  );
}

const HINTS: Record<CopyState, string> = {
  idle: "",
  copied: card.ticked,
  failed: card.failed
};

/** The chip in the corner: a copy glyph that turns into a tick, as a gamemode's does, or a cross. */
function Hint({ ref, state }: { ref: Ref<HTMLSpanElement>; state: CopyState }) {
  return (
    <span
      ref={ref}
      className={`${card.hint} ${card.swap} ${styles.hint} ${HINTS[state]}`}
      aria-hidden="true"
    >
      {state === "failed" ? <X /> : <Copy className={card.glyph} />}
      <Check className={card.tick} />
    </span>
  );
}
