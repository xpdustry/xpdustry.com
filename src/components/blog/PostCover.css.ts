import { style } from "@vanilla-extract/css";
import { media } from "#app/styles/media";
import { font, leading, tracking } from "#app/styles/scale";
import { vars } from "#app/styles/theme.css";
import { ground, logo as themedLogo } from "./themed.css";

export const cover = style([
  ground,
  {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    minHeight: 300,
    padding: "40px 44px 34px",
    "@media": {
      [media.phone]: { padding: "28px 24px" },
    },
  },
]);

export const logo = style([
  themedLogo,
  {
    position: "absolute",
    top: "50%",
    right: 56,
    width: 132,
    translate: "0 -50%",
    "@media": {
      [media.tablet]: { display: "none" },
    },
  },
]);

export const crumbs = style({
  display: "grid",
  gridTemplateColumns: "max-content minmax(0, 1fr)",
  gap: "0 8px",
  alignSelf: "stretch",
  alignItems: "start",
});

/** The caret sits closer to its word than an icon does. */
export const back = style({
  gap: 4,
});

export const topic = style({
  justifySelf: "start",
});

/** The `h1` around the topic and the title when the page's title carries both. */
export const heading = style({
  display: "contents",
});

export const title = style({
  gridColumn: "1 / -1",
  maxWidth: "17ch",
  marginTop: 18,
  fontSize: font.display,
  lineHeight: leading.tight,
  letterSpacing: tracking.display,
  textWrap: "balance",
  "@media": {
    [media.phone]: { fontSize: font.h2 },
  },
});

export const description = style({
  maxWidth: "52ch",
  marginTop: 16,
  fontSize: font.lead,
  color: vars.muted,
});

export const byline = style({
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 24,
});
