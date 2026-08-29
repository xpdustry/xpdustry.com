import { globalStyle, style } from "@vanilla-extract/css";
import { badgeBaseRule, badgeToneRules } from "#app/components/system/Badge.css";
import {
  colors,
  layout,
  leading,
  media,
  motion,
  palette,
  radii,
  space,
  tracking,
  type,
  weight,
} from "#app/styles/theme.css";

export const document = style({
  color: colors.inkMuted,
  lineHeight: leading.relaxed,
});

globalStyle(`${document} > * + *`, {
  marginBlockStart: space.four,
});

globalStyle(`${document} h2, ${document} h3`, {
  color: colors.ink,
  scrollMarginBlockStart: "6.5rem",
});

globalStyle(`${document} h2`, {
  marginBlockStart: space.sixteen,
  paddingBlockEnd: space.three,
  borderBlockEnd: `1px solid ${colors.lineSoft}`,
  fontSize: type.threeXl,
  fontStretch: "110%",
  fontWeight: weight.bold,
  letterSpacing: tracking.tight,
  "@media": {
    [media.sm]: {
      fontSize: type.fourXl,
    },
  },
});

globalStyle(`${document} h3`, {
  marginBlockStart: space.eight,
  fontSize: type.xl,
  fontWeight: weight.bold,
  "@media": {
    [media.sm]: {
      fontSize: type.twoXl,
    },
  },
});

globalStyle(`${document} > h2:first-child, ${document} > h3:first-child`, {
  marginBlockStart: 0,
});

globalStyle(`${document} p, ${document} ul, ${document} ol`, {
  maxInlineSize: layout.prose,
});

globalStyle(`${document} ul, ${document} ol`, {
  paddingInlineStart: space.six,
});

globalStyle(`${document} ul`, {
  listStyle: "disc",
});

globalStyle(`${document} ol`, {
  listStyle: "decimal",
});

globalStyle(`${document} li + li`, {
  marginBlockStart: space.two,
});

globalStyle(`${document} li::marker`, {
  color: colors.inkFaint,
});

globalStyle(`${document} strong`, {
  color: colors.ink,
  fontWeight: weight.bold,
});

globalStyle(`${document} :not(pre) > code`, {
  padding: "0.12em 0.36em",
  border: `1px solid ${colors.lineSoft}`,
  borderRadius: radii.sm,
  background: colors.pageSunk,
  color: colors.ink,
  fontFamily: type.mono,
  fontSize: "0.8em",
  letterSpacing: tracking.tight,
  wordBreak: "break-word",
});

globalStyle(`${document} hr`, {
  marginBlock: space.twelve,
  border: 0,
  borderBlockStart: `1px solid ${colors.lineSoft}`,
});

globalStyle(`${document} .anchor`, {
  marginInlineStart: space.two,
  color: colors.inkFaint,
  fontWeight: weight.normal,
  textDecoration: "none",
  opacity: 0,
  transition: `opacity ${motion.fast} ${motion.ease}`,
});

globalStyle(
  `${document} h2:hover .anchor, ${document} h3:hover .anchor, ${document} .anchor:focus-visible`,
  {
    opacity: 1,
  },
);

globalStyle(`${document} table`, {
  inlineSize: "100%",
  borderCollapse: "collapse",
  fontSize: type.sm,
});

globalStyle(`${document} th, ${document} td`, {
  padding: `${space.three} ${space.four}`,
  borderBlockEnd: `1px solid ${colors.lineSoft}`,
  textAlign: "start",
  verticalAlign: "top",
});

globalStyle(`${document} tbody tr:last-child th, ${document} tbody tr:last-child td`, {
  borderBlockEnd: 0,
});

globalStyle(`${document} thead th`, {
  background: colors.pageSunk,
  color: colors.inkFaint,
  fontFamily: type.mono,
  fontSize: type.data,
  fontWeight: weight.medium,
  letterSpacing: tracking.wider,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
});

globalStyle(`${document} tbody td:first-child`, {
  color: colors.ink,
  fontWeight: weight.bold,
  whiteSpace: "nowrap",
});

globalStyle(`${document} tbody td:first-child code`, {
  whiteSpace: "nowrap",
});

globalStyle(`${document} td code`, {
  overflowWrap: "anywhere",
  whiteSpace: "normal",
});

globalStyle(`${document} a`, {
  color: colors.ink,
  fontWeight: weight.semibold,
  textDecoration: "underline",
  textDecorationColor: colors.lineSoft,
  textDecorationThickness: "2px",
  textUnderlineOffset: "3px",
});

globalStyle(`${document} a:hover`, {
  textDecorationColor: colors.ink,
});

globalStyle(`${document} .t-c`, {
  color: colors.codeComment,
  fontStyle: "italic",
});

globalStyle(`${document} .t-s`, {
  color: colors.codeString,
});

globalStyle(`${document} .t-n`, {
  color: colors.codeNumber,
});

globalStyle(`${document} .t-k`, {
  color: colors.ink,
  fontWeight: weight.bold,
});

globalStyle(`${document} .markdown-alert`, {
  display: "grid",
  justifyItems: "start",
  gap: space.three,
  padding: `${space.four} ${space.six}`,
  border: `1px solid ${colors.lineSoft}`,
  borderInlineStart: `4px solid ${colors.line}`,
  borderRadius: radii.lg,
  background: colors.panel,
});

globalStyle(`${document} .markdown-alert-title`, {
  ...badgeBaseRule,
  ...badgeToneRules.quiet,
  padding: "0.1875rem 0.75rem",
  borderRadius: space.half,
});

globalStyle(`${document} .markdown-alert-content`, {
  display: "grid",
  gap: space.four,
});

globalStyle(`${document} .markdown-alert-warning`, {
  borderInlineStartColor: palette.signalWall,
});

globalStyle(`${document} .markdown-alert-warning .markdown-alert-title`, {
  borderColor: palette.signalWall,
  background: palette.signal,
  color: palette.onSignal,
});

globalStyle(`${document} .post-media`, {
  marginBlock: space.eight,
});

globalStyle(`${document} .post-media__frame`, {
  display: "block",
  overflow: "hidden",
  border: `2px solid ${colors.line}`,
  borderRadius: radii.twoXl,
  background: colors.pageSunk,
  lineHeight: 0,
});

globalStyle(`${document} .post-media__caption`, {
  marginBlockStart: space.three,
  color: colors.inkFaint,
  fontSize: type.sm,
  lineHeight: leading.base,
  textAlign: "center",
});

globalStyle(`${document} .media img, ${document} .media video`, {
  display: "block",
  inlineSize: "100%",
  blockSize: "auto",
});

globalStyle(`${document} .media`, {
  "@media": {
    [media.lg]: {
      inlineSize: "calc(100% + 6rem)",
      marginInline: "-3rem",
    },
  },
});
