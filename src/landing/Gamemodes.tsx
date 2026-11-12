import { assignInlineVars } from "@vanilla-extract/dynamic";
import { T, useGT, useMessages } from "gt-tanstack-start";
import { useId, useRef, useState, type MouseEvent, type Ref } from "react";
import { findServer, playerCount } from "#app/status/live";
import { PlayerCount } from "#app/status/PlayerCount";
import type { ServerSnapshot, ServerSnapshotItem } from "#app/status/snapshots";
import { Patches } from "#app/textures/Patches";
import { Spread, spreadFromPress, type SpreadStart } from "#app/textures/Spread";
import { CopyCard } from "#app/ui/copy/CopyCard";
import { useCopy, type CopyState } from "#app/ui/copy/useCopy";
import { Hostname } from "#app/ui/Hostname";
import { Check, Copy, GameController, X } from "#app/ui/icons";
import { Tray } from "#app/ui/Tray";
import { gamemodes, type Gamemode } from "./modes";
import { useSeen } from "./useSeen";
import * as card from "#app/ui/Card.css";
import * as styles from "./Gamemodes.css";

const FRINGES = import.meta.glob<string>("/src/textures/assets/fringe/*.webp", {
  eager: true,
  query: "?url",
  import: "default"
});

const STATES: Record<CopyState, string> = {
  idle: "",
  copied: styles.copied,
  failed: styles.failed
};

export function Gamemodes({ snapshot }: { snapshot: ServerSnapshot }) {
  const gt = useGT();
  const list = useRef<HTMLUListElement>(null);
  const seen = useSeen(list);
  return (
    <Tray
      id="gamemodes"
      icon={GameController}
      title={gt("Gamemodes")}
      subtitle={<PlayerCount count={playerCount(snapshot.servers)} className={styles.total} />}
    >
      <ul ref={list} className={styles.modes}>
        {gamemodes.map((mode) => (
          <Mode
            key={mode.server}
            mode={mode}
            server={findServer(snapshot, mode.server)}
            seen={seen}
          />
        ))}
      </ul>
    </Tray>
  );
}

/** A mode's card. A press anywhere on it copies its server's address, in a spread of its colour. */
function Mode({
  mode,
  server,
  seen
}: {
  mode: Gamemode;
  server?: ServerSnapshotItem;
  seen: boolean;
}) {
  const gt = useGT();
  const m = useMessages();
  const hostname = server?.hostname ?? "";
  const { state, spread, chip, press } = useModePress(hostname);
  const ids = useId();
  const Icon = mode.icon;
  return (
    <CopyCard
      as="li"
      className={`${styles.mode} ${STATES[state]}`}
      style={assignInlineVars({ [styles.tint]: mode.edge.side.color })}
      text={hostname}
      state={state}
      copied={gt("Copied {address}. Paste it in Play, Join game, Add server.", {
        address: hostname
      })}
      cover={{
        "aria-labelledby": `${ids}name ${ids}line ${ids}action`,
        title: gt("Copy {address}", { address: hostname }),
        disabled: !hostname,
        onClick: press
      }}
    >
      <Tint edge={mode.edge} />
      <Spread tiles={seen ? mode.spread : undefined} on={state === "copied"} from={spread} />
      <div className={styles.band}>
        <Icon className={styles.icon} />
        <div className={styles.id}>
          <h3 id={`${ids}name`} className={styles.name}>
            {m(mode.name)}
          </h3>
          <span id={`${ids}line`} className={styles.line}>
            <Players server={server} />
            <Said failed={state === "failed"} hostname={hostname} />
          </span>
          <span id={`${ids}action`} hidden>
            <T>. Copy the server address</T>
          </span>
        </div>
        <Chip ref={chip} failed={state === "failed"} />
      </div>
      <p className={styles.about}>{m(mode.description)}</p>
    </CopyCard>
  );
}

/**
 * A press on a mode's card: it copies the address and starts a spread where it landed, or from
 * the chip for a key press.
 */
function useModePress(hostname: string) {
  const { state, copy } = useCopy(hostname);
  const [spread, setSpread] = useState<SpreadStart>();
  const chip = useRef<HTMLSpanElement>(null);

  const press = (event: MouseEvent<HTMLButtonElement>) => {
    const box = event.currentTarget.parentElement!.getBoundingClientRect();
    setSpread(spreadFromPress(event, box, chip.current!.getBoundingClientRect()));
    void copy();
  };
  return { state, spread, chip, press };
}

/** The mode's colour down the band, its patches past the band's side or its fringe below it. */
function Tint({ edge }: { edge: Gamemode["edge"] }) {
  const fringe = FRINGES[`/src/textures/assets/fringe/${edge.below.name}.webp`];
  return (
    <span className={styles.tinted} aria-hidden="true">
      <span className={`${styles.edge} ${styles.side}`}>
        <Patches patches={edge.side} className={styles.patches} />
      </span>
      <span
        className={`${styles.edge} ${styles.below}`}
        style={{ backgroundImage: `url("${fringe}")` }}
      />
    </span>
  );
}

function Players({ server }: { server?: ServerSnapshotItem }) {
  const count = playerCount(server ? [server] : []);
  const empty = count.state === "online" && count.players === 0;
  return <PlayerCount count={count} className={`${styles.count} ${empty ? styles.empty : ""}`} />;
}

/**
 * What takes the player count's place after a press: a one-word "Copied", which fits where the
 * count was in every language, or the address to select when the copy failed.
 */
function Said({ failed, hostname }: { failed: boolean; hostname: string }) {
  const gt = useGT();
  return (
    <span className={styles.said} aria-hidden="true">
      {failed ? <Hostname name={hostname} /> : gt("Copied")}
    </span>
  );
}

/** The copy chip, which turns into a tick once the copy landed, or a cross when it failed. */
function Chip({ ref, failed }: { ref: Ref<HTMLSpanElement>; failed: boolean }) {
  return (
    <span
      ref={ref}
      className={`${card.chip} ${styles.mark} ${failed ? card.failed : ""}`}
      aria-hidden="true"
    >
      {failed ? <X /> : <Copy className={styles.glyph} />}
      <Check className={styles.tick} />
    </span>
  );
}
