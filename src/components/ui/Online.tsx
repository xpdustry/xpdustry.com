import type { ReactNode } from "react";
import styles from "./Online.module.css";

/** `children` with a status light before it, green unless `offline`. */
export function Online({
  offline = false,
  className,
  children,
}: {
  offline?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={`${styles.online} ${offline ? styles.offline : ""} ${className ?? ""}`}>
      {children}
    </span>
  );
}
