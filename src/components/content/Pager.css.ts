import { style, type StyleRule } from "@vanilla-extract/css";
import { colors, leading, media, space, tracking, type, weight } from "#app/styles/theme.css";

export const pager = style({
  display: "grid",
  gap: space.four,
  marginTop: space.sixteen,
  paddingTop: space.eight,
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: colors.lineSoft,
  gridTemplateColumns: "1fr",
  "@media": { [media.sm]: { gridTemplateColumns: "repeat(2, 1fr)" } },
});

const pagerLinkRule = {
  display: "grid",
  alignContent: "center",
  gap: space.half,
  padding: `${space.four} ${space.six}`,
  textAlign: "left",
} satisfies StyleRule;

export const face = style(pagerLinkRule);

export const nextFace = style([pagerLinkRule, { textAlign: "right" }]);

export const next = style({
  "@media": { [media.sm]: { gridColumnStart: "2" } },
});

export const direction = style({
  color: colors.inkFaint,
  fontFamily: type.mono,
  fontSize: type.data,
  letterSpacing: tracking.tight,
  lineHeight: leading.body,
});

export const title = style({
  color: colors.ink,
  fontWeight: weight.bold,
  lineHeight: leading.body,
});
