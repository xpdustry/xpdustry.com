import { style } from "@vanilla-extract/css";
import { media } from "#app/ui/styles/media";
import { font, leading, rem, tracking } from "#app/ui/styles/scale";
import { vars } from "#app/ui/styles/theme.css";
import { ground, logo as themedLogo } from "./topicTheme.css";

export const cover = style([
  ground,
  {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    minHeight: 300,
    padding: "40px 44px 34px",
    "@media": {
      [media.phone]: { padding: "28px 24px" }
    }
  }
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
      [media.tablet]: { display: "none" }
    }
  }
]);

/**
 * The back link and the topic share a line while they fit, and the title always starts a line of
 * its own: the zero-height break before it takes a whole line.
 */
export const crumbs = style({
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  alignSelf: "stretch",
  alignItems: "flex-start",
  "::before": {
    content: '""',
    order: 1,
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
  order: 2,
  flexBasis: "100%",
  minWidth: 0,
  maxWidth: "17ch",
  marginTop: 2,
  fontSize: rem(font.display),
  lineHeight: leading.tight,
  letterSpacing: tracking.display,
  textWrap: "balance",
  "@media": {
    [media.phone]: { fontSize: rem(font.h2) }
  }
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
