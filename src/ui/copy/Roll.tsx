import type { ReactNode } from "react";
import * as styles from "./Roll.css";

export function Roll({
  id,
  rolled,
  said,
  saidClassName,
  children
}: {
  id?: string;
  rolled: boolean;
  said: ReactNode;
  saidClassName?: string;
  children: ReactNode;
}) {
  return (
    <span id={id} className={`${styles.line} ${rolled ? styles.rolled : ""}`}>
      {children}
      <span className={`${styles.said} ${saidClassName ?? ""}`} aria-hidden="true">
        {said}
      </span>
    </span>
  );
}
