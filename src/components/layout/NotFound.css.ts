import { style } from "@vanilla-extract/css";
import { layoutStyles } from "#app/styles/layout.css";
import { colors, leading, media, space, tracking, type, weight } from "#app/styles/theme.css";

export const page = style([
  layoutStyles.wrap,
  {
    paddingBlock: space.thirtyTwo,
    textAlign: "center",
  },
]);

export const code = style({
  color: colors.inkFaint,
  fontFamily: type.mono,
  fontSize: type.fiveXl,
  fontWeight: weight.bold,
  letterSpacing: tracking.tighter,
  lineHeight: leading.none,
  "@media": { [media.sm]: { fontSize: "6rem" } },
});

export const title = style({
  marginTop: space.four,
  fontSize: type.fourXl,
  lineHeight: leading.fourXl,
  fontWeight: weight.extraBold,
  fontStretch: "110%",
  letterSpacing: tracking.tight,
  "@media": { [media.sm]: { fontSize: type.fiveXl, lineHeight: leading.fiveXl } },
});

export const message = style({
  maxWidth: "65ch",
  marginInline: "auto",
  marginTop: space.four,
  color: colors.inkMuted,
  fontSize: type.base,
  lineHeight: leading.base,
  "@media": { [media.sm]: { fontSize: type.lg, lineHeight: leading.lg } },
});

export const actions = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "center",
  gap: space.four,
  marginTop: space.eight,
});
