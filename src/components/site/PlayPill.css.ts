import { globalStyle, style } from "@vanilla-extract/css";
import { upTo } from "#app/styles/media";
import { font, leading } from "#app/styles/scale";
import { vars } from "#app/styles/theme.css";

/** Where the address has no room. */
const narrow = upTo(780);

export const pill = style({
  whiteSpace: "nowrap",
});

globalStyle(`${pill} svg`, {
  width: 16,
  height: 16,
});

export const count = style({
  font: `500 ${font.caption}px / ${leading.tight} ${vars.fontMono}`,
  letterSpacing: 0,
});

/** No room to say why there is no count: the grey light says it. */
export const waiting = style({
  "@media": {
    [narrow]: { gap: 0, fontSize: 0 },
  },
});

/** After the count, behind a rule. */
const divided = style([
  count,
  {
    marginLeft: -2,
    paddingLeft: 10,
    borderLeft: `2px solid color-mix(in srgb, ${vars.onAmber} 16%, transparent)`,
  },
]);

export const address = style([
  divided,
  {
    "@media": {
      [narrow]: { display: "none" },
    },
  },
]);

/** What a press does, where the address has no room. */
export const brief = style([
  divided,
  {
    display: "none",
    "@media": {
      [narrow]: { display: "inline" },
    },
  },
]);
