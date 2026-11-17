import { globalStyle, style } from "@vanilla-extract/css";
import { upTo } from "#app/ui/styles/media";
import { font, leading, rem } from "#app/ui/styles/scale";
import { vars } from "#app/ui/styles/theme.css";

const narrow = upTo(840);
const PILL_HEIGHT = 40;

export const pill = style({
  whiteSpace: "nowrap"
});

globalStyle(`${pill} svg`, {
  width: 16,
  height: 16
});

export const count = style({
  font: `500 ${rem(font.caption)} / ${leading.tight} ${vars.fontMono}`,
  letterSpacing: 0
});

const divided = style([
  count,
  {
    marginLeft: -2,
    paddingLeft: 10,
    borderLeft: `2px solid color-mix(in srgb, ${vars.onAmber} 16%, transparent)`
  }
]);

export const address = style([
  divided,
  {
    "@media": {
      [narrow]: { display: "none" }
    }
  }
]);

export const refused = style({
  minWidth: "max-content",
  userSelect: "all",
  "@media": {
    [narrow]: {
      display: "inline",
      minWidth: 0,
      whiteSpace: "normal",
      margin: 0,
      padding: 0,
      border: 0
    }
  }
});

export const aside = style({
  "@media": {
    [narrow]: { display: "none" }
  }
});

globalStyle(`button${pill}:has(${refused}) > span`, {
  "@media": {
    [narrow]: { minHeight: PILL_HEIGHT, padding: "5px 12px", gap: 8 }
  }
});

export const brief = style([
  divided,
  {
    display: "none",
    "@media": {
      [narrow]: { display: "inline" }
    }
  }
]);
