import { style } from "@vanilla-extract/css";
import { media } from "#app/ui/styles/media";
import { font, insideOutline, OUTLINE, rem } from "#app/ui/styles/scale";
import { displayTitle } from "#app/ui/styles/titles";
import { vars } from "#app/ui/styles/theme.css";
import { ground, logo as themedLogo } from "./topicTheme.css";

export const cover = style([
  ground,
  {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    minHeight: 300,
    padding: insideOutline(40, 44, 34),
    "@media": {
      [media.phone]: { padding: insideOutline(28, 24) }
    }
  }
]);

export const logo = style([
  themedLogo,
  {
    position: "absolute",
    top: "50%",
    right: 56 + OUTLINE,
    width: 132,
    translate: "0 -50%",
    "@media": {
      [media.tablet]: { display: "none" }
    }
  }
]);

const CRUMB_ORDER = { lineBreak: 1, title: 2 } as const;

export const crumbs = style({
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  alignSelf: "stretch",
  alignItems: "flex-start",
  "::before": {
    content: '""',
    order: CRUMB_ORDER.lineBreak,
    flexBasis: "100%"
  }
});

export const back = style({
  gap: 4
});

export const topic = style({
  justifySelf: "start"
});

export const heading = style({
  display: "contents"
});

export const title = style({
  order: CRUMB_ORDER.title,
  flexBasis: "100%",
  minWidth: 0,
  maxWidth: "17ch",
  marginTop: 2,
  ...displayTitle()
});

export const description = style({
  maxWidth: "52ch",
  marginTop: 16,
  fontSize: rem(font.lead),
  color: vars.muted
});

export const byline = style({
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 24
});
