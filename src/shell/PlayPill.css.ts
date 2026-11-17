import { globalStyle, style } from "@vanilla-extract/css";
import { HUB } from "#app/status/servers";
import { font, leading, rem } from "#app/ui/styles/scale";
import { reachTouchTarget } from "#app/ui/styles/touch";
import { PLINTH_CENTRED_ABOVE_ITS_BOX_BY } from "#app/ui/Plinth.css";
import { vars } from "#app/ui/styles/theme.css";

const PILL_HEIGHT = 40;
const FACE = { padding: 27, gap: 10, divider: 10, dot: 18, icon: 16 };
const COUNT_DIGITS = "8,888".length;
const MONO_CHARACTER_WITH_TEXT_SPACING = "1.2ch";

const noRoomFor = (px: number, characters: number) =>
  `(width < calc(${px}px + ${characters} * ${MONO_CHARACTER_WITH_TEXT_SPACING}))`;
const countAndIcon = FACE.padding + FACE.dot + FACE.gap + FACE.icon;
const divided = FACE.gap + FACE.divider;
const noRoomForHostname = noRoomFor(countAndIcon + divided, COUNT_DIGITS + HUB.hostname.length);
const noRoomForLabel = noRoomFor(countAndIcon + divided, COUNT_DIGITS + "IP".length);
const noRoomForCount = noRoomFor(countAndIcon, COUNT_DIGITS);
const REFUSED_FACE = { padding: 24, gap: 8 };
const hostnameDomain = HUB.hostname.split(".").slice(-2).join(".");
const noRoomForRefusedIcon = noRoomFor(
  REFUSED_FACE.padding + REFUSED_FACE.gap + FACE.icon,
  hostnameDomain.length
);

const text = `500 ${rem(font.caption)} / ${leading.tight} ${vars.fontMono}`;

export const slot = style({
  containerType: "inline-size",
  font: text
});

export const pill = style({
  whiteSpace: "nowrap"
});

reachTouchTarget(pill, PLINTH_CENTRED_ABOVE_ITS_BOX_BY);

globalStyle(`${pill} svg`, {
  width: 16,
  height: 16
});

globalStyle(`${slot} ${pill} > span`, {
  gap: FACE.gap,
  padding: "10px 13px 10px 14px",
  "@container": {
    [noRoomForCount]: { paddingInline: 12 }
  }
});

export const count = style({
  font: text,
  letterSpacing: 0,
  "@container": {
    [noRoomForCount]: { display: "none" }
  }
});

const dividedPart = style([
  count,
  {
    marginLeft: -2,
    paddingLeft: 10,
    borderLeft: `2px solid color-mix(in srgb, ${vars.onAmber} 16%, transparent)`
  }
]);

export const address = style([
  dividedPart,
  {
    "@container": {
      [noRoomForHostname]: { display: "none" }
    }
  }
]);

export const refused = style({
  minWidth: "max-content",
  userSelect: "all",
  "@container": {
    [noRoomForHostname]: {
      display: "inline",
      minWidth: 0,
      whiteSpace: "normal",
      overflowWrap: "anywhere",
      margin: 0,
      padding: 0,
      border: 0
    }
  }
});

export const aside = style({
  "@container": {
    [noRoomForHostname]: { display: "none" }
  }
});

globalStyle(`${slot} ${pill}:has(${refused}) > span`, {
  "@container": {
    [noRoomForHostname]: {
      minHeight: PILL_HEIGHT,
      padding: `5px ${REFUSED_FACE.padding / 2}px`,
      gap: REFUSED_FACE.gap
    }
  }
});

globalStyle(`${pill}:has(${refused}) > span > svg:last-child`, {
  "@container": {
    [noRoomForRefusedIcon]: { display: "none" }
  }
});

export const brief = style([
  dividedPart,
  {
    display: "none",
    "@container": {
      [noRoomForHostname]: { display: "inline" },
      [noRoomForLabel]: { display: "none" }
    }
  }
]);
