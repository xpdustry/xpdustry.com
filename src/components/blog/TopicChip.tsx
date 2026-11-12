import type { CSSProperties } from "react";
import { topic } from "#app/data/topics";
import styles from "./TopicChip.module.css";

/** The topic a post is filed under, in its project's colours, with its icon when it has one. */
export function TopicChip({ name, className }: { name: string; className?: string }) {
  const { icon, chip } = topic(name);
  return (
    <span
      className={`${styles.chip} ${className ?? ""}`}
      style={{ "--chip": chip.background, "--chip-ink": chip.color } as CSSProperties}
    >
      {icon && <img src={icon} alt="" />}
      {name}
    </span>
  );
}
