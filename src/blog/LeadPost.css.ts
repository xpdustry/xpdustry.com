import { globalStyle, style } from "@vanilla-extract/css";
import { media } from "#app/ui/styles/media";
import { font, radius, rem } from "#app/ui/styles/scale";
import { displayTitle } from "#app/ui/styles/titles";
import { vars } from "#app/ui/styles/theme.css";
import { ground, logo as themedLogo } from "./topicTheme.css";

const pad = { block: 42, inline: 46 };
const padPhone = { block: 28, inline: 24 };

export const lead = style([
  ground,
  {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.1fr)",
    gap: 40,
    minHeight: 400,
    padding: `${pad.block}px ${pad.inline}px`,
    "@media": {
      [media.tablet]: { gridTemplateColumns: "1fr" },
      [media.phone]: { padding: `${padPhone.block}px ${padPhone.inline}px` }
    }
  }
]);

export const text = style({
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  minWidth: 0
});

export const tags = style({
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  alignSelf: "flex-start",
  marginBottom: "auto"
});

globalStyle(`${lead} h2`, {
  marginTop: 28,
  ...displayTitle()
});

globalStyle(`${lead} p`, {
  maxWidth: "46ch",
  marginTop: 14,
  color: vars.muted
});

export const byline = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 9,
  marginTop: 20,
  fontSize: rem(font.small),
  color: vars.muted
});

export const shot = style({
  position: "relative",
  overflow: "hidden",
  alignSelf: "stretch",
  margin: `0 -${pad.inline + 2}px -${pad.block + 2}px 0`,
  border: "2px solid rgb(0 0 0 / 0.55)",
  borderRight: 0,
  borderBottom: 0,
  borderRadius: `${radius.lg}px 0 0`,
  background: vars.stage,
  "@media": {
    [media.tablet]: { minHeight: 260 },
    [media.phone]: { margin: `0 -${padPhone.inline + 2}px -${padPhone.block + 2}px 0` }
  }
});

globalStyle(`${shot} img`, {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  objectPosition: "left top",
  transformOrigin: "left top",
  transition: `scale 0.6s ${vars.easeOut}`
});

globalStyle(`${lead}:hover ${shot} img`, {
  scale: "1.03"
});

export const logo = style([
  themedLogo,
  {
    alignSelf: "center",
    justifySelf: "center",
    width: 168,
    "@media": {
      [media.tablet]: { display: "none" }
    }
  }
]);
