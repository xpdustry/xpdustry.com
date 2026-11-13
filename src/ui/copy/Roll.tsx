import type { ReactNode } from "react";
import * as styles from "./Roll.css";

/**
 * A copy card's line, such as its player count, which `said` takes the place of once `rolled`:
 * the line rolls up and out as `said` rolls up and in. Screen readers hear how the copy went from
 * the card instead.
 */
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
