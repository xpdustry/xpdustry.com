import { assignInlineVars } from "@vanilla-extract/dynamic";
import type { CSSProperties } from "react";
import type { Topic } from "./topics";
import { face } from "#app/ui/Card.css";
import { vars } from "#app/ui/styles/theme.css";
import { accent, accentInk } from "./topicTheme.css";

export function themed(theme: Topic): CSSProperties {
  return {
    ...assignInlineVars({
      [face]: theme.ground,
      [vars.muted]: theme.muted,
      [accent]: theme.accent,
      [accentInk]: theme.chip.color
    })
  };
}
