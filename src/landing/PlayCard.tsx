import { T, useGT } from "gt-tanstack-start";
import type { PlayerCount as Count } from "#app/status/live";
import { PlayerCount } from "#app/status/PlayerCount";
import { HUB } from "#app/status/servers";
import { PATCHES, SPREADS } from "#app/textures/cards";
import { Patches } from "#app/textures/Patches";
import { Spread } from "#app/textures/Spread";
import { CopyCard } from "#app/ui/copy/CopyCard";
import { CopyChip } from "#app/ui/copy/CopyChip";
import { Roll } from "#app/ui/copy/Roll";
import { Hostname } from "#app/ui/Hostname";
import { useCopyPress } from "./useCopyPress";
import { useSeen } from "./useSeen";
import * as card from "#app/ui/Card.css";
import * as styles from "./PlayCard.css";

export function PlayCard({ players, className }: { players: Count; className?: string }) {
  const gt = useGT();
  const { state, outcome, address, spread, chip, press } = useCopyPress(HUB.hostname);
  const seen = useSeen(chip);
  const failed = state === "failed";
  return (
    <CopyCard
      as="section"
      id="servers"
      className={`${styles.play} ${failed ? styles.failed : ""} ${className ?? ""}`}
      text={HUB.hostname}
      outcome={outcome}
      cover={{
        "aria-label": gt("Copy {address}", { address: HUB.hostname }),
        title: gt("Copy address"),
        onClick: press
      }}
    >
      <Patches patches={PATCHES.play} />
      <Spread palette={seen ? SPREADS.play : undefined} on={state === "copied"} from={spread} />
      <CopyChip ref={chip} state={state} className={`${card.hint} ${styles.hint}`} />
      <h2 className={styles.label}>
        <T>Play with us</T>
      </h2>
      <span ref={address} className={styles.address}>
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
