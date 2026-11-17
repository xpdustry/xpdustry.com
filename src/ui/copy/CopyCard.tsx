import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { CopyStatus } from "./CopyStatus";
import type { CopyState } from "./useCopy";
import * as card from "../Card.css";

interface CopyCardProps {
  as: "li" | "section";
  id?: string;
  className: string;
  style?: CSSProperties;
  text: string;
  state: CopyState;
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
  state,
  copiedMessage,
  cover,
  children
}: CopyCardProps) {
  return (
    <Card id={id} className={`${card.card} ${className}`} style={style}>
      <button type="button" className={card.cover} {...cover} />
      {children}
      <CopyStatus state={state} text={text} copiedMessage={copiedMessage} />
    </Card>
  );
}
