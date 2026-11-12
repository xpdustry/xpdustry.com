import { assignInlineVars } from "@vanilla-extract/dynamic";
import { T, useGT, useMessages } from "gt-tanstack-start";
import { useId, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { Tray } from "#app/components/tray/Tray";
import { CopyStatus } from "#app/components/ui/CopyStatus";
import { Hostname } from "#app/components/ui/Hostname";
import { Patches } from "#app/components/ui/Patches";
import { PlayerCount } from "#app/components/ui/PlayerCount";
import { Spread, spreadFrom } from "#app/components/ui/Spread";
import { gamemodes, type Gamemode } from "#app/data/gamemodes";
import { findServer, playerCount } from "#app/data/live";
import type { ServerSnapshot, ServerSnapshotItem } from "#app/data/snapshots";
import { Check, Copy, GameController, X } from "#app/lib/icons";
import { useCopy } from "#app/lib/useCopy";
import * as card from "#app/components/ui/Card.css";
import * as styles from "./Gamemodes.css";

const FRINGES = import.meta.glob<string>("/src/assets/fringe/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});

export function Gamemodes({ snapshot }: { snapshot: ServerSnapshot }) {
  const gt = useGT();
  return (
    <Tray
      id="gamemodes"
      icon={GameController}
      title={gt("Gamemodes")}
      subtitle={<PlayerCount count={playerCount(snapshot.servers)} className={styles.total} />}
    >
      <ul className={styles.modes}>
        {gamemodes.map((mode) => (
          <Mode key={mode.server} mode={mode} server={findServer(snapshot, mode.server)} />
        ))}
      </ul>
    </Tray>
  );
}

function Mode({ mode, server }: { mode: Gamemode; server?: ServerSnapshotItem }) {
  const gt = useGT();
  const m = useMessages();
  const count = playerCount(server ? [server] : []);
  const hostname = server?.hostname ?? "";
  const { state, copy } = useCopy(hostname);
  const [spread, setSpread] = useState<ReturnType<typeof spreadFrom>>();
  const [brief, setBrief] = useState(false);
  const said = useRef<HTMLSpanElement>(null);
  const mark = useRef<HTMLSpanElement>(null);
  const ids = useId();

  useLayoutEffect(() => {
    const line = said.current;
    if (state === "copied" && line && line.scrollWidth > line.clientWidth) setBrief(true);
  }, [state, spread]);

  const press = (event: MouseEvent<HTMLButtonElement>) => {
    const box = event.currentTarget.parentElement!.getBoundingClientRect();
    const spot = mark.current!.getBoundingClientRect();
    const [x, y] = event.detail
      ? [event.clientX, event.clientY]
      : [spot.left + spot.width / 2, spot.top + spot.height / 2];
    setSpread(spreadFrom([x - box.left, y - box.top], box.width, box.height));
    setBrief(false);
    void copy();
  };

  const copied = state === "copied";
  const failed = state === "failed";
  const empty = count.state === "online" && count.players === 0;
  const Icon = mode.icon;
  return (
    <li
      className={`${card.card} ${styles.mode} ${copied ? styles.copied : ""} ${failed ? styles.failed : ""}`}
      style={assignInlineVars({ [styles.tint]: mode.edge.side.color })}
    >
      <button
        type="button"
        className={card.cover}
        aria-labelledby={`${ids}name ${ids}line ${ids}action`}
        title={gt("Copy {address}", { address: hostname })}
        disabled={!hostname}
        onClick={press}
      />
      <span className={styles.tinted} aria-hidden="true">
        <span className={`${styles.edge} ${styles.side}`}>
          <Patches patches={mode.edge.side} className={styles.patches} />
        </span>
        <span
          className={`${styles.edge} ${styles.below}`}
          style={{
            backgroundImage: `url("${FRINGES[`/src/assets/fringe/${mode.edge.below.name}.webp`]}")`,
          }}
        />
      </span>
      <Spread tiles={mode.spread} on={copied} origin={spread?.origin} reach={spread?.reach} />
      <div className={styles.band}>
        <Icon className={styles.icon} />
        <div className={styles.id}>
          <h3 id={`${ids}name`} className={styles.name}>
            {m(mode.name)}
          </h3>
          <span id={`${ids}line`} className={styles.line}>
            <PlayerCount count={count} className={`${styles.count} ${empty ? styles.empty : ""}`} />
            <span ref={said} className={styles.said} aria-hidden="true">
              {failed ? (
                <Hostname name={hostname} />
              ) : brief ? (
                gt("Copied")
              ) : (
                gt("Copied, paste it in Join game")
              )}
            </span>
          </span>
          <span id={`${ids}action`} hidden>
            <T>. Copy the server address</T>
          </span>
        </div>
        <span
          ref={mark}
          className={`${card.chip} ${styles.mark} ${failed ? card.failed : ""}`}
          aria-hidden="true"
        >
          {failed ? <X /> : <Copy className={styles.glyph} />}
          <Check className={styles.tick} />
        </span>
      </div>
      <p className={styles.about}>{m(mode.description)}</p>
      <CopyStatus
        state={state}
        text={hostname}
        copied={gt("Copied {address}. Paste it in Play, Join game, Add server.", {
          address: hostname,
        })}
      />
    </li>
  );
}
