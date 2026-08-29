import { style, styleVariants, type StyleRule } from "@vanilla-extract/css";
import {
  colors,
  leading,
  palette,
  radii,
  space,
  tracking,
  type,
  weight,
} from "#app/styles/theme.css";

export const badgeBaseRule = {
  display: "inline-flex",
  alignItems: "center",
  gap: space.two,
  padding: `${space.half} ${space.three}`,
  borderWidth: "1px",
  borderStyle: "solid",
  borderRadius: radii.sm,
  fontFamily: type.mono,
  fontSize: type.xs,
  fontWeight: weight.semibold,
  letterSpacing: tracking.tight,
  lineHeight: leading.normal,
  whiteSpace: "nowrap",
} satisfies StyleRule;

export const badgeToneRules = {
  quiet: {
    borderColor: colors.lineSoft,
    backgroundColor: colors.pageSunk,
    color: colors.inkMuted,
  },
  default: {
    borderColor: colors.line,
    backgroundColor: colors.panel,
  },
  accent: {
    borderColor: palette.accentWall,
    backgroundColor: palette.accent,
    color: palette.onAccent,
  },
  signal: {
    borderColor: palette.signalWall,
    backgroundColor: palette.signal,
    color: palette.onSignal,
  },
  danger: {
    borderColor: palette.dangerWall,
    backgroundColor: palette.danger,
    color: palette.onDanger,
  },
} satisfies Record<string, StyleRule>;

const badgeBase = style(badgeBaseRule);

export const badge = styleVariants({
  quiet: [badgeBase, badgeToneRules.quiet],
  default: [badgeBase, badgeToneRules.default],
  accent: [badgeBase, badgeToneRules.accent],
  signal: [badgeBase, badgeToneRules.signal],
  danger: [badgeBase, badgeToneRules.danger],
});

export type BadgeTone = keyof typeof badge;
