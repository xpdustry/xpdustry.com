import { T } from "gt-tanstack-start";
import { Fragment } from "react";
import { Copy } from "#app/ui/icons";
import * as styles from "./ClajRoom.css";

const PLAYERS = [
  { name: "alpha", color: "#ffd37f" },
  { name: "beta", color: "#84f491" },
  { name: "gamma", color: "#8ad4ff" }
] as const;

export function ClajRoom({ link, icon }: { link: string; icon?: string }) {
  return (
    <span className={styles.room} aria-hidden="true">
      <span className={styles.bar}>
        {icon && <img src={icon} alt="" />}
        <T>Manage CLaJ Room</T>
      </span>
      <span className={styles.body}>
        <span className={styles.link}>
          {breakable(link).map((part, index) => (
            <Fragment key={part}>
              {index > 0 && <wbr />}
              {part}
            </Fragment>
          ))}
        </span>
        <span className={styles.actions}>
          <span className={styles.how}>
            <T>Friends paste it in Play › Join via CLaJ › Use Link</T>
          </span>
          <span className={styles.copy}>
            <Copy />
            <T>Copy Link</T>
          </span>
        </span>
        <span className={styles.players}>
          {PLAYERS.map(({ name, color }) => (
            <span key={name} className={styles.player}>
              <span className={styles.unit} style={{ background: color }} />
              <span style={{ color }}>{name}</span>
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}

function breakable(link: string): string[] {
  const [scheme, address = ""] = link.split("://");
  return [`${scheme}://`, ...address.split(/(?=[:/])/)];
}
