import type { ReactNode } from "react";
import * as styles from "./Online.css";

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
