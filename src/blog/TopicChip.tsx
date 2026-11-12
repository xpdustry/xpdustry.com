import { assignInlineVars } from "@vanilla-extract/dynamic";
import { topic } from "./topics";
import * as styles from "./TopicChip.css";

interface TopicChipProps {
  name: string;
  tone?: "card" | "cover";
  version?: string;
  linked?: boolean;
  className?: string;
}

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
