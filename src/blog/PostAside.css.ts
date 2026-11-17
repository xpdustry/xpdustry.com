import { globalStyle, style } from "@vanilla-extract/css";
import { media, narrowerThan } from "#app/ui/styles/media";
import { font, insideOutline, radius, rem, tracking } from "#app/ui/styles/scale";
import { vars } from "#app/ui/styles/theme.css";

const stackedControls = narrowerThan(512);

export const aside = style({
  containerType: "inline-size",
  position: "sticky",
  top: 18,
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: vars.gap,
  "@media": {
    [media.tablet]: { position: "static" }
  }
});

export const panel = style({
  padding: insideOutline(22)
});

export const label = style({
  minWidth: 0,
  overflowWrap: "break-word",
  hyphens: "auto",
  fontSize: rem(font.h4),
  letterSpacing: tracking.title
});

export const release = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 10,
  marginTop: 14,
  selectors: {
    "& + &": { marginTop: 10 }
  },
  "@container": {
    [stackedControls]: { flexDirection: "column", flexWrap: "nowrap", alignItems: "stretch" }
  }
});

globalStyle(`${release} code`, {
  padding: "6px 9px",
  borderRadius: radius.sm,
  background: vars.n3,
  font: `500 ${rem(font.caption)} ${vars.fontMono}`,
  "@container": {
    [stackedControls]: { alignSelf: "start" }
  }
});

globalStyle(`${release} > a`, {
  maxWidth: "100%",
  marginLeft: "auto",
  overflowWrap: "anywhere",
  "@container": {
    [stackedControls]: { marginLeft: 0 }
  }
});

export const share = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  "@container": {
    [stackedControls]: {
      flexDirection: "column",
      flexWrap: "nowrap",
      alignItems: "stretch",
      gap: 14
    }
  }
});

globalStyle(`:is(${release}, ${share}) > :is(a, button) > span`, {
  "@container": {
    [stackedControls]: { flex: 1, justifyContent: "center" }
  }
});
