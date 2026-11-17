import type { Ref } from "react";
import { Check, Copy, X } from "../icons";
import type { CopyState } from "./useCopy";
import * as styles from "./CopyChip.css";

const SHOWN: Record<CopyState, string> = {
  idle: "",
  copied: styles.ticked,
  failed: styles.failed
};

export function CopyChip({
  ref,
  state,
  className,
  glyphClassName = ""
}: {
  ref: Ref<HTMLSpanElement>;
  state: CopyState;
  className: string;
  glyphClassName?: string;
}) {
  return (
    <span ref={ref} className={`${className} ${styles.stacked} ${SHOWN[state]}`} aria-hidden="true">
      {state === "failed" ? <X /> : <Copy className={`${styles.glyph} ${glyphClassName}`} />}
      <Check className={styles.tick} />
    </span>
  );
}
