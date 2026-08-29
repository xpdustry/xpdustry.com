import { style, type StyleRule } from "@vanilla-extract/css";
import { layout, leading, media, tracking, type, weight } from "#app/styles/theme.css";

export const layoutRules = {
  wrap: {
    width: `min(calc(100% - ${layout.gutter} * 2), ${layout.page})`,
    marginInline: "auto",
  },
  prose: { maxWidth: layout.measure },
  pageTitle: {
    fontSize: type.fourXl,
    fontWeight: weight.extraBold,
    fontStretch: "110%",
    letterSpacing: tracking.tight,
    lineHeight: leading.fourXl,
    "@media": {
      [media.sm]: { fontSize: type.fiveXl, lineHeight: leading.fiveXl },
    },
  },
  lede: {
    maxWidth: layout.measure,
    fontSize: type.base,
    lineHeight: leading.base,
    "@media": { [media.sm]: { fontSize: type.lg, lineHeight: leading.lg } },
  },
  screenReaderOnly: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    borderWidth: 0,
  },
} satisfies Record<string, StyleRule>;

export const layoutStyles = {
  wrap: style(layoutRules.wrap),
  prose: style(layoutRules.prose),
  pageTitle: style(layoutRules.pageTitle),
  lede: style(layoutRules.lede),
  screenReaderOnly: style(layoutRules.screenReaderOnly),
};
