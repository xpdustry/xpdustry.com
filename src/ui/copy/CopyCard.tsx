import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { CopyStatus } from "./CopyStatus";
import type { CopyState } from "./useCopy";
import * as card from "../Card.css";

interface CopyCardProps {
  /** A card in a list of them, or a section of its own. */
  as: "li" | "section";
  id?: string;
  className: string;
  style?: CSSProperties;
  /** What a press copies, and how the copy went, from `useCopy`. */
  text: string;
  state: CopyState;
  /** What screen readers hear once the copy landed, "Copied {text}" if left out. */
  copied?: string;
  /** The button covering the card: its name, and what a press does. */
  cover: ButtonHTMLAttributes<HTMLButtonElement>;
  children: ReactNode;
}

/**
 * A card a press anywhere on copies `text`: a button covers it, and screen readers hear how the
 * copy went after the card's content.
 */
export function CopyCard({
  as: Card,
  id,
  className,
  style,
  text,
  state,
  copied,
  cover,
  children
}: CopyCardProps) {
  return (
    <Card id={id} className={`${card.card} ${className}`} style={style}>
      <button type="button" className={card.cover} {...cover} />
      {children}
      <CopyStatus state={state} text={text} copied={copied} />
    </Card>
  );
}
