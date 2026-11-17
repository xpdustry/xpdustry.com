import { assignInlineVars } from "@vanilla-extract/dynamic";
import { T, useGT, useMessages } from "gt-tanstack-start";
import { useId, useRef, type RefCallback } from "react";
import { findServer, playerCount } from "#app/status/live";
import { PlayerCount } from "#app/status/PlayerCount";
import type { ServerSnapshot, ServerSnapshotItem } from "#app/status/snapshots";
import { texture } from "#app/textures/enter";
import { Patches } from "#app/textures/Patches";
import { Spread } from "#app/textures/Spread";
import { CopyCard } from "#app/ui/copy/CopyCard";
import { CopyChip } from "#app/ui/copy/CopyChip";
import { Roll } from "#app/ui/copy/Roll";
import type { CopyState } from "#app/ui/copy/useCopy";
import { Hostname } from "#app/ui/Hostname";
import { GameController } from "#app/ui/icons";
import { Tray } from "#app/ui/Tray";
import { gamemodes, type Gamemode } from "./modes";
import { useCopyPress } from "./useCopyPress";
import { useSeen } from "./useSeen";
import * as card from "#app/ui/Card.css";
import * as styles from "./Gamemodes.css";

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
            key={mode.serverSlug}
            mode={mode}
            server={findServer(snapshot, mode.serverSlug)}
            seen={seen}
          />
        ))}
      </ul>
    </Tray>
  );
}

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
  const { state, outcome, address, spread, chip, press } = useCopyPress(hostname);
  const ids = useId();
  const Icon = mode.icon;
  return (
    <CopyCard
      as="li"
      className={`${styles.mode} ${STATES[state]}`}
      style={assignInlineVars({ [styles.tint]: mode.edge.color })}
      text={hostname}
      outcome={outcome}
      copiedMessage={gt("Copied {address}. Paste it in Play, Join game, Add server.", {
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
      <Spread palette={seen ? mode.spread : undefined} on={state === "copied"} from={spread} />
      <div className={styles.band}>
        <Icon className={styles.icon} />
        <div className={styles.id}>
          <h3 id={`${ids}name`} className={styles.name}>
            {m(mode.name)}
          </h3>
          <Roll
            id={`${ids}line`}
            rolled={state !== "idle"}
            said={<Said failed={state === "failed"} hostname={hostname} address={address} />}
            saidClassName={styles.said}
          >
            <Players server={server} />
          </Roll>
          <span id={`${ids}action`} hidden>
            <T>. Copy the server address</T>
          </span>
        </div>
        <CopyChip
          ref={chip}
          state={state}
          className={`${card.chip} ${styles.chip}`}
          glyphClassName={styles.glyph}
        />
      </div>
      <p className={styles.about}>{m(mode.description)}</p>
    </CopyCard>
  );
}

function Tint({ edge }: { edge: Gamemode["edge"] }) {
  return (
    <span
      className={styles.tinted}
      aria-hidden="true"
      {...texture("face")}
      suppressHydrationWarning
    >
      <span className={`${styles.edge} ${styles.side}`}>
        <Patches patches={edge} className={styles.patches} still />
      </span>
      <span className={`${styles.edge} ${styles.fringe}`} />
    </span>
  );
}

function Players({ server }: { server?: ServerSnapshotItem }) {
  const count = playerCount(server ? [server] : []);
  const empty = count.state === "online" && count.players === 0;
  return <PlayerCount count={count} className={`${styles.count} ${empty ? styles.empty : ""}`} />;
}

function Said({
  failed,
  hostname,
  address
}: {
  failed: boolean;
  hostname: string;
  address: RefCallback<HTMLElement>;
}) {
  const gt = useGT();
  return failed ? (
    <span ref={address}>
      <Hostname name={hostname} />
    </span>
  ) : (
    gt("Copied")
  );
}
