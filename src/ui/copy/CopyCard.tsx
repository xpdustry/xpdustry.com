import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { CopyStatus } from "./CopyStatus";
import type { CopyOutcome } from "./useCopy";
import * as card from "../Card.css";

interface CopyCardProps {
  as: "li" | "section";
  id?: string;
  className: string;
  style?: CSSProperties;
  text: string;
  outcome: CopyOutcome | undefined;
  copiedMessage?: string;
  cover: ButtonHTMLAttributes<HTMLButtonElement>;
  children: ReactNode;
}

export function CopyCard({
  as: Card,
  id,
  className,
  style,
  text,
  outcome,
  copiedMessage,
  cover,
  children
}: CopyCardProps) {
  return (
    <Card id={id} className={`${card.card} ${className}`} style={style}>
      <button type="button" className={card.cover} {...cover} />
      {children}
      <CopyStatus outcome={outcome} text={text} copiedMessage={copiedMessage} />
    </Card>
  );
}
