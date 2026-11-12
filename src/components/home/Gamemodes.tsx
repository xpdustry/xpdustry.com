import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import router from "#app/assets/mindustry/router.png";
import { Tray } from "#app/components/tray/Tray";
import { CopyButton } from "#app/components/ui/CopyButton";
import { ChevronDown } from "#app/components/ui/Icons";
import { PlayerCount } from "#app/components/ui/PlayerCount";
import { Texture } from "#app/components/ui/Texture";
import { gamemodes, type Gamemode } from "#app/data/gamemodes";
import { findServer, playerCount } from "#app/data/live";
import type { ServerSnapshot } from "#app/data/snapshots";
import { wave } from "#app/data/textures";
import { useMediaQuery } from "#app/lib/useMediaQuery";
import card from "#app/components/ui/Card.module.css";
import styles from "./Gamemodes.module.css";

const FOLD_MS = 280;

/**
 * Wide, a list of modes beside the panel of the one picked; narrow, an accordion where each row
 * folds its own panel open beneath it. Either way at most one panel shows, and going wide always
 * shows the last one opened.
 */
export function Gamemodes({ snapshot }: { snapshot: ServerSnapshot }) {
  const wide = useMediaQuery("(min-width: 901px)", true);
  const [current, setCurrent] = useState(gamemodes[0]!.server);
  const [open, setOpen] = useState(true);
  const rows = useRef(new Map<string, HTMLButtonElement>());

  // narrow, every fold can be shut; a change of layout opens the current one again
  const [layout, setLayout] = useState(wide);
  if (layout !== wide) {
    setLayout(wide);
    setOpen(true);
  }

  const expanded = (mode: Gamemode) => mode.server === current && (wide || open);

  const toggle = (mode: Gamemode) => {
    const motion = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fold = (server: string) => document.getElementById(foldId(server))!;

    if (wide) {
      if (mode.server === current) return;
      flushSync(() => setCurrent(mode.server));
      if (motion)
        fold(mode.server).animate({ opacity: [0, 1] }, { duration: 180, easing: "ease-out" });
      return;
    }

    // one fold at a time: the open one shuts while this one opens, both in the same motion
    const closing = expanded(mode) ? mode : gamemodes.find(expanded);
    const opening = expanded(mode) ? undefined : mode;
    const heights = new Map(
      [closing, opening].flatMap((m) => (m ? [[m.server, fold(m.server).offsetHeight]] : [])),
    );
    flushSync(() => {
      if (opening) setCurrent(opening.server);
      setOpen(opening !== undefined);
    });
    if (!motion) return;

    for (const [server, from] of heights) {
      const element = fold(server);
      const to = server === opening?.server ? element.firstElementChild!.clientHeight : 0;
      element.getAnimations().forEach((animation) => animation.cancel());
      element.animate(
        { height: [`${from}px`, `${to}px`], visibility: ["visible", "visible"] },
        { duration: FOLD_MS, easing: "cubic-bezier(.22,1,.36,1)" },
      );
    }
    // if the row ends up above the screen, it slides back into view
    if (opening) {
      setTimeout(() => {
        const row = rows.current.get(opening.server);
        if (row && row.getBoundingClientRect().top < 0) {
          row.scrollIntoView({ block: "start", behavior: motion ? "smooth" : "instant" });
        }
      }, FOLD_MS + 20);
    }
  };

  const moveFocus = (event: KeyboardEvent, index: number) => {
    const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = gamemodes[(index + step + gamemodes.length) % gamemodes.length]!;
    rows.current.get(next.server)?.focus();
  };

  return (
    <Tray
      id="gamemodes"
      icon={router}
      title="Gamemodes"
      subtitle={
        <PlayerCount
          count={playerCount(snapshot.servers)}
          className={styles.total}
          unit={(players) =>
            players === 1 ? " player online right now" : " players online right now"
          }
        />
      }
    >
      <div className={styles.modes}>
        {gamemodes.map((mode, index) => {
          const server = findServer(snapshot, mode.server);
          const count = playerCount(server ? [server] : []);
          const hostname = server?.hostname ?? "";
          return (
            <div key={mode.server} className={styles.item}>
              <button
                ref={(row) => {
                  if (row) rows.current.set(mode.server, row);
                  else rows.current.delete(mode.server);
                }}
                type="button"
                id={rowId(mode.server)}
                className={`${card.card} spot ${styles.row}`}
                style={{ "--tint": mode.tint } as CSSProperties}
                aria-expanded={expanded(mode)}
                aria-controls={foldId(mode.server)}
                onClick={() => toggle(mode)}
                onKeyDown={(event) => moveFocus(event, index)}
              >
                <span className={styles.icon} aria-hidden="true">
                  {mode.icon.patches.map((settings, at) => (
                    <Texture key={at} settings={settings} drift="solo" />
                  ))}
                  {mode.icon.sprites.map((sprite, at) => (
                    <img
                      key={at}
                      className="sprite"
                      src={sprite.src}
                      alt=""
                      style={{ left: sprite.left, top: sprite.top, width: sprite.width }}
                    />
                  ))}
                </span>
                <span className={styles.name}>{mode.name}</span>
                <PlayerCount
                  count={count}
                  className={styles.online}
                  unit={<span className={styles.unit}> online</span>}
                />
                <ChevronDown className={styles.chevron} />
              </button>
              <section
                id={foldId(mode.server)}
                className={styles.fold}
                aria-labelledby={rowId(mode.server)}
              >
                <Panel
                  mode={mode}
                  count={count}
                  hostname={hostname}
                  map={server?.status === "online" ? server.info.map : undefined}
                />
              </section>
            </div>
          );
        })}
      </div>
    </Tray>
  );
}

function Panel({
  mode,
  count,
  hostname,
  map,
}: {
  mode: Gamemode;
  count: ReturnType<typeof playerCount>;
  hostname: string;
  map?: string;
}) {
  return (
    <div className={styles.panel}>
      <img
        className={styles.photo}
        src={mode.screenshot.src}
        alt=""
        style={{ objectPosition: mode.screenshot.position }}
      />
      <Texture settings={wave([22, 110], [0.05, 0.8, mode.wavePhase])} />
      <div className={styles.head}>
        <span className={styles.figures} aria-hidden="true">
          {mode.figures.map((figure, at) => (
            <img
              key={at}
              className="sprite"
              src={figure.src}
              alt=""
              style={{ width: figure.width }}
            />
          ))}
        </span>
        <h3>{mode.name}</h3>
      </div>
      <p data-fit="">{mode.description}</p>
      <div className={styles.foot}>
        <dl>
          <div>
            <dt>Map</dt>
            <dd>{map ?? "Unknown"}</dd>
          </div>
          <div className={styles.live}>
            <dt>Online</dt>
            <dd>
              <PlayerCount count={count} unit="" />
            </dd>
          </div>
        </dl>
        <div className={styles.join}>
          <code>{hostname}</code>
          <CopyButton text={hostname} label={`Copy ${hostname}`} />
        </div>
      </div>
    </div>
  );
}

const rowId = (server: string) => `gamemode-${server}`;
const foldId = (server: string) => `gamemode-${server}-panel`;
