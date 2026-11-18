import { globalStyle, style } from "@vanilla-extract/css";
import { HUB, servers } from "#app/status/servers";
import { font, leading, rem } from "#app/ui/styles/scale";
import { reachTouchTarget } from "#app/ui/styles/touch";
import { PLINTH_CENTRED_ABOVE_ITS_BOX_BY } from "#app/ui/Plinth.css";
import { vars } from "#app/ui/styles/theme.css";

const PILL_HEIGHT = 40;
const FACE = { padding: 27, gap: 10, divider: 10, dot: 18, icon: 16 };
/** Each game server reports its players as a 32-bit integer. */
const MOST_PLAYERS = servers.length * (2 ** 31 - 1);
const LONGEST_COUNT = MOST_PLAYERS.toLocaleString("en").length;

/**
 * The slot is wide enough for drawn parts of `px`, `spaced` characters that cannot wrap, with room
 * for the letter spacing WCAG lets readers add, and the hostname's characters, which wrap instead.
 */
const roomFor = ({ px, spaced = 0 }: { px: number; spaced?: number }) =>
  `(width >= calc(${px}px + ${spaced} * 1.2ch + ${HUB.hostname.length} * 1ch))`;

const roomForRefusedOnOneLine = roomFor({ px: FACE.padding + FACE.gap + FACE.icon });

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
  padding: "10px 13px 10px 14px"
});

export const count = style({
  font: text,
  letterSpacing: 0
});

export const address = style({
  font: text,
  letterSpacing: 0,
  whiteSpace: "normal",
  marginLeft: -2,
  paddingLeft: 10,
  borderLeft: `2px solid color-mix(in srgb, ${vars.onAmber} 16%, transparent)`
});

export const brief = style({
  font: text,
  letterSpacing: 0
});

export const refused = style({
  font: text,
  letterSpacing: 0,
  whiteSpace: "normal",
  overflowWrap: "anywhere",
  userSelect: "all"
});

globalStyle(`${slot} :is(${count}, ${address})`, {
  display: "none"
});

for (let length = 0; length <= LONGEST_COUNT; length++) {
  const roomForEverything = roomFor({
    px:
      FACE.padding +
      (length === 0 ? FACE.icon : FACE.dot) +
      2 * FACE.gap +
      FACE.divider +
      FACE.icon,
    spaced: length
  });
  const shown = `${slot}[data-count-length="${length}"]`;
  globalStyle(`${shown} ${count}`, {
    "@container": { [roomForEverything]: { display: "inline-flex" } }
  });
  globalStyle(`${shown} ${address}`, {
    "@container": { [roomForEverything]: { display: "inline" } }
  });
  globalStyle(`${shown} ${brief}`, {
    "@container": { [roomForEverything]: { display: "none" } }
  });
}

globalStyle(`${slot} ${pill}:has(${refused}) > span`, {
  minHeight: PILL_HEIGHT,
  padding: "5px 12px",
  gap: 8,
  "@container": {
    [roomForRefusedOnOneLine]: { padding: "10px 13px 10px 14px", gap: FACE.gap }
  }
});

globalStyle(`${slot} ${pill}:has(${refused}) > span > svg:last-child`, {
  display: "none",
  "@container": {
    [roomForRefusedOnOneLine]: { display: "block" }
  }
});
