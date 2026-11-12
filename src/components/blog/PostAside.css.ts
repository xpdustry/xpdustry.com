import { globalStyle, style } from "@vanilla-extract/css";
import { media } from "#app/styles/media";
import { font, radius, rem, tracking } from "#app/styles/scale";
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

export const panel = style({
  padding: 22,
});

export const label = style({
  minWidth: 0,
  fontSize: rem(font.h4),
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
  font: `500 ${rem(font.caption)} ${vars.fontMono}`,
});

globalStyle(`${release} > a`, {
  maxWidth: "100%",
  marginLeft: "auto",
  overflowWrap: "anywhere",
});

export const share = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
});
