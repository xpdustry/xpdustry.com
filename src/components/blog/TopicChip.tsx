import { assignInlineVars } from "@vanilla-extract/dynamic";
import { topic } from "#app/data/topics";
import * as styles from "./TopicChip.css";

interface TopicChipProps {
  name: string;
  /** On a light card, or on a cover in the topic's own colours. */
  tone?: "card" | "cover";
  /** The release of the project the post is about, after its name. */
  version?: string;
  /** Links to the project's website, where it has one. */
  linked?: boolean;
  className?: string;
}

/** The topic a post is filed under, in its project's colours, with its icon when it has one. */
export function TopicChip({ name, tone = "card", version, linked, className }: TopicChipProps) {
  const { icon, chip, website } = topic(name);
  const href = linked ? website : undefined;
  const Tag = href ? "a" : "span";
  return (
    <Tag
      href={href}
      className={`${styles.tone[tone]} ${className ?? ""}`}
      style={
        tone === "card"
          ? assignInlineVars({ [styles.face]: chip.background, [styles.ink]: chip.color })
          : undefined
      }
    >
      {icon && <img src={icon} alt="" />}
      {version ? `${name} ${version}` : name}
    </Tag>
  );
}
