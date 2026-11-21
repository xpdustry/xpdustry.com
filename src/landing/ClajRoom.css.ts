import { globalStyle, style } from "@vanilla-extract/css";
import { media } from "#app/ui/styles/media";
import { font, leading, radius, rem } from "#app/ui/styles/scale";
import { figures } from "./sections";
import { vars } from "#app/ui/styles/theme.css";
import { featured } from "./Projects.css";

const PANEL = "#2b2724";
const WELL = "#1c1917";
const EDGE = "rgb(255 255 255 / 0.1)";
const ACCENT = "#ffd37f";

export const room = style({
  display: "flex",
  flexDirection: "column",
  marginTop: 19,
  overflow: "hidden",
  border: `1px solid ${EDGE}`,
  borderRadius: radius.md,
  background: PANEL,
  color: "#f2ede8",
  overflowWrap: "anywhere",
  boxShadow: "0 20px 50px -18px rgb(0 0 0 / 0.7)",
  transition: `translate 0.45s ${vars.easeOut}`,
  "@media": {
    [media.hover]: {
      selectors: { [`${featured}:hover &`]: { translate: "0 -8px" } }
    }
  }
});

export const bar = style({
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 16px",
  borderBottom: `3px solid ${ACCENT}`,
  fontSize: rem(font.small),
  fontWeight: 600
});

globalStyle(`${bar} img`, {
  width: 22,
  borderRadius: 5
});

export const body = style({
  display: "flex",
  flexDirection: "column",
  gap: 14,
  padding: 16
});

export const link = style({
  padding: "10px 14px",
  border: `1px solid ${EDGE}`,
  borderRadius: radius.sm,
  background: WELL,
  font: figures(leading.snug)
});

export const actions = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px 16px"
});

export const copy = style({
  display: "inline-flex",
  minWidth: 0,
  alignItems: "center",
  gap: 6,
  padding: "7px 12px",
  borderRadius: radius.xs,
  background: ACCENT,
  color: "#2b1d07",
  fontSize: rem(font.caption),
  fontWeight: 700,
  transition: `scale 0.3s ${vars.easeSpring}`,
  "@media": {
    [media.hover]: {
      selectors: { [`${featured}:hover &`]: { scale: "1.06" } }
    }
  }
});

globalStyle(`${copy} svg`, {
  flex: "none",
  width: 15,
  height: 15
});

export const how = style({
  flex: "1 1 24ch",
  textWrap: "pretty",
  color: "rgb(242 237 232 / 0.7)",
  fontSize: rem(font.caption),
  lineHeight: leading.snug
});

export const players = style({
  display: "flex",
  flexWrap: "wrap",
  gap: 8
});

export const player = style({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 12px 6px 6px",
  borderRadius: radius.sm,
  background: WELL,
  font: figures(leading.snug)
});

export const unit = style({
  width: 18,
  height: 18,
  borderRadius: 4,
  boxShadow: "inset 0 -3px 0 rgb(0 0 0 / 0.25)"
});
