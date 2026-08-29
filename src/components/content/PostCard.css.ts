import { style } from "@vanilla-extract/css";
import { badge } from "#app/components/system/Badge.css";
import {
  colors,
  leading,
  media,
  radii,
  space,
  tracking,
  type,
  weight,
} from "#app/styles/theme.css";

export const face = style({
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
  gap: space.three,
  padding: space.six,
  textAlign: "left",
});

export const topic = style([
  badge.quiet,
  {
    alignSelf: "flex-start",
  },
]);

export const title = style({
  color: colors.ink,
  fontSize: type.xl,
  fontWeight: weight.bold,
  lineHeight: leading.tight,
  "@media": { [media.sm]: { fontSize: type.twoXl } },
});

export const meta = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: space.three,
  marginTop: "auto",
  paddingTop: space.four,
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: colors.lineSoft,
  color: colors.inkMuted,
  fontSize: type.sm,
});

export const author = style({
  display: "inline-flex",
  minWidth: 0,
  alignItems: "center",
  gap: space.two,
  overflowWrap: "anywhere",
});

export const avatar = style({
  display: "block",
  width: space.six,
  height: space.six,
  flexShrink: 0,
  borderRadius: radii.full,
  objectFit: "cover",
});

export const date = style({
  color: colors.inkFaint,
  fontFamily: type.mono,
  fontSize: type.data,
  letterSpacing: tracking.tight,
});
