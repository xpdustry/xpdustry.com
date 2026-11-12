import { assignInlineVars } from "@vanilla-extract/dynamic";
import type { CSSProperties } from "react";
import type { Topic } from "#app/data/topics";
import { vars } from "#app/styles/theme.css";
import { accent, accentInk } from "./themed.css";

/** The inline style that dresses a card in its topic's colours: its ground, muted text and accent. */
export function themed(theme: Topic): CSSProperties {
  return {
    background: theme.ground,
    ...assignInlineVars({
      [vars.muted]: theme.muted,
      [accent]: theme.accent,
      [accentInk]: theme.chip.color,
    }),
  };
}
