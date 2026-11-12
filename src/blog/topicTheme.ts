import { assignInlineVars } from "@vanilla-extract/dynamic";
import type { CSSProperties } from "react";
import type { Topic } from "./topics";
import { vars } from "#app/ui/styles/theme.css";
import { accent, accentInk } from "./topicTheme.css";

export function themed(theme: Topic): CSSProperties {
  return {
    background: theme.ground,
    ...assignInlineVars({
      [vars.muted]: theme.muted,
      [accent]: theme.accent,
      [accentInk]: theme.chip.color
    })
  };
}
