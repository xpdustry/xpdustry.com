import { globalStyle, style } from "@vanilla-extract/css";
import { media } from "#app/styles/media";
import { font, radius, tracking } from "#app/styles/scale";
import { vars } from "#app/styles/theme.css";

export const aside = style({
  position: "sticky",
  top: 18,
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: vars.gap,
  "@media": {
    [media.tablet]: { position: "static" },
  },
});

/** A `card`, padded. */
export const panel = style({
  padding: 22,
});

export const label = style({
  fontSize: font.h4,
  letterSpacing: tracking.title,
});

export const release = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 10,
  marginTop: 14,
  selectors: {
    "& + &": { marginTop: 10 },
  },
});

globalStyle(`${release} code`, {
  padding: "6px 9px",
  borderRadius: radius.sm,
  background: vars.n3,
  font: `500 ${font.caption}px ${vars.fontMono}`,
  whiteSpace: "nowrap",
});

globalStyle(`${release} > a`, {
  marginLeft: "auto",
});

export const share = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
});
