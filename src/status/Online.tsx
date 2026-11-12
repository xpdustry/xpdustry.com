import type { ReactNode } from "react";
import * as styles from "./Online.css";

/** `children` with a status light before it, green unless `offline`. */
export function Online({
  offline = false,
  className,
  children
}: {
  offline?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const classes = [styles.online, offline && styles.offline, className];
  return <span className={classes.filter(Boolean).join(" ")}>{children}</span>;
}
