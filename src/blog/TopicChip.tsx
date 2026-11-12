import { assignInlineVars } from "@vanilla-extract/dynamic";
import type { CSSProperties } from "react";
import { topicLabel } from "./titles";
import { topic, type Topic } from "./topics";
import * as styles from "./TopicChip.css";

type Tone = keyof typeof styles.tone;

interface TopicChipProps {
  name: string;
  tone?: Tone;
  version?: string;
  linked?: boolean;
  className?: string;
}

/** A card chip wears its project's colours; a cover chip takes the accent of the cover it sits on. */
const colours: Record<Tone, (chip: Topic["chip"]) => CSSProperties | undefined> = {
  card: (chip) => assignInlineVars({ [styles.face]: chip.background, [styles.ink]: chip.color }),
  cover: () => undefined
};

export function TopicChip({ name, tone = "card", version, linked, className }: TopicChipProps) {
  const { icon, chip, website } = topic(name);
  const href = linked ? website : undefined;
  const Tag = href ? "a" : "span";
  return (
    <Tag
      href={href}
      className={`${styles.tone[tone]} ${className ?? ""}`}
      style={colours[tone](chip)}
    >
      {icon && <img src={icon} alt="" />}
      {topicLabel(name, version)}
    </Tag>
  );
}
