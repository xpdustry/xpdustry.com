import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { Tray } from "#app/components/tray/Tray";
import { Check, Copy, GameController } from "#app/components/ui/Icons";
import { Patches } from "#app/components/ui/Patches";
import { PlayerCount } from "#app/components/ui/PlayerCount";
import { Spread, spreadFrom } from "#app/components/ui/Spread";
import { gamemodes, type Gamemode } from "#app/data/gamemodes";
import { findServer, playerCount } from "#app/data/live";
import type { ServerSnapshot, ServerSnapshotItem } from "#app/data/snapshots";
import card from "#app/components/ui/Card.module.css";
import styles from "./Gamemodes.module.css";

const FRINGES = import.meta.glob<string>("/src/assets/fringe/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});

/** How long a card says its address was copied, or shows the address when it could not be. */
const COPIED_MS = 1800;
const FAILED_MS = 6000;

/** One mode to a row, at every width: a press anywhere on it copies its server's address. */
export function Gamemodes({ snapshot }: { snapshot: ServerSnapshot }) {
  return (
    <Tray
      id="gamemodes"
      icon={GameController}
      title="Gamemodes"
      subtitle={
        <>
          Chaotic Neutral Mindustry servers ·{" "}
          <PlayerCount count={playerCount(snapshot.servers)} className={styles.total} />
        </>
      }
    >
      <ul className={styles.modes}>
        {gamemodes.map((mode) => (
          <Mode key={mode.server} mode={mode} server={findServer(snapshot, mode.server)} />
        ))}
      </ul>
    </Tray>
  );
}

/** The last copy from a card: whether it landed, and where the click that asked for it did. */
interface Copied extends ReturnType<typeof spreadFrom> {
  ok: boolean;
}

function Mode({ mode, server }: { mode: Gamemode; server?: ServerSnapshotItem }) {
  const count = playerCount(server ? [server] : []);
  const hostname = server?.hostname ?? "";
  const [copied, setCopied] = useState<Copied>();
  const [shown, setShown] = useState(false);
  // the long message, unless the header is too narrow for it
  const [brief, setBrief] = useState(false);
  const said = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  useLayoutEffect(() => {
    const line = said.current;
    if (shown && line && line.scrollWidth > line.clientWidth) setBrief(true);
  }, [shown, copied]);

  const copy = async (event: MouseEvent<HTMLButtonElement>) => {
    // the reticulate spreads over the whole card, from the press; a keyboard press has no place
    // of its own, and spreads from the copy mark
    const box = event.currentTarget.closest("li")!.getBoundingClientRect();
    const mark = event.currentTarget.lastElementChild!.getBoundingClientRect();
    const [x, y] = event.detail
      ? [event.clientX, event.clientY]
      : [mark.left + mark.width / 2, mark.top + mark.height / 2];
    const origin = [x - box.left, y - box.top] as const;
    // no clipboard at all, as on a page served without https, fails like a refused write
    const ok = await Promise.resolve()
      .then(() => navigator.clipboard.writeText(hostname))
      .then(
        () => true,
        () => false,
      );
    setCopied({ ok, ...spreadFrom(origin, box.width, box.height) });
    setBrief(false);
    setShown(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShown(false), ok ? COPIED_MS : FAILED_MS);
  };

  const landed = shown && copied?.ok === true;
  const failed = shown && copied?.ok === false;
  const empty = count.state === "online" && count.players === 0;
  const Icon = mode.icon;
  return (
    <li
      className={`${card.card} ${styles.mode} ${landed ? styles.copied : ""} ${failed ? styles.failed : ""}`}
      style={{ "--tint": mode.edge.side.color } as CSSProperties}
    >
      {/* the mode's colour, ending in a frayed edge instead of a line */}
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
      <Spread tiles={mode.spread} on={landed} origin={copied?.origin} reach={copied?.reach} />
      <h3 className={styles.head}>
        {/* the whole card answers to it */}
        <button
          type="button"
          className={styles.band}
          title={`Copy ${hostname}`}
          disabled={!hostname}
          onClick={copy}
        >
          <Icon className={styles.icon} />
          <span className={styles.id}>
            <span className={styles.name}>{mode.name}</span>
            <span className={styles.line}>
              <PlayerCount
                count={count}
                className={`${styles.count} ${empty ? styles.empty : ""}`}
              />
              {/* said aloud by the output below */}
              <span ref={said} className={styles.said} aria-hidden="true">
                {copied?.ok === false
                  ? hostname
                  : brief
                    ? "Copied"
                    : "Copied, paste it in Join game"}
              </span>
            </span>
            <span className="sr-only">. Copy the server address</span>
          </span>
          <span className={styles.mark} aria-hidden="true">
            <Copy className={styles.glyph} />
            <Check className={styles.tick} />
          </span>
        </button>
      </h3>
      <p className={styles.about}>{mode.description}</p>
      <output className="sr-only">
        {landed && `Copied ${hostname}. Paste it in Play, Join game, Add server.`}
        {failed && `Could not copy. The address is ${hostname}.`}
      </output>
    </li>
  );
}
