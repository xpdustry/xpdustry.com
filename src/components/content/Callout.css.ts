import { styleVariants, type StyleRule } from "@vanilla-extract/css";
import { badge } from "#app/components/system/Badge.css";
import { colors, palette, radii, space } from "#app/styles/theme.css";

const calloutRule = {
  display: "grid",
  justifyItems: "start",
  gap: space.three,
  padding: `${space.four} ${space.six}`,
  borderWidth: "1px",
  borderInlineStartWidth: space.one,
  borderStyle: "solid",
  borderColor: colors.lineSoft,
  borderInlineStartColor: colors.line,
  borderRadius: radii.lg,
  backgroundColor: colors.panel,
} satisfies StyleRule;

export const callout = styleVariants({
  note: calloutRule,
  warn: [calloutRule, { borderInlineStartColor: palette.signalWall }],
  danger: [calloutRule, { borderInlineStartColor: palette.danger }],
});

export const calloutBadge = {
  note: badge.quiet,
  warn: badge.signal,
  danger: badge.danger,
} satisfies Record<keyof typeof callout, string>;

export type CalloutVariant = keyof typeof callout;
