import { globalStyle, style } from "@vanilla-extract/css";
import { upTo } from "#app/ui/styles/media";
import { font, leading, rem } from "#app/ui/styles/scale";
import { vars } from "#app/ui/styles/theme.css";
import { folded } from "./Header.css";

const narrow = upTo(780);
/**
 * Beside the header's unfolded navigation, where "Checking" in French leaves no room for the links:
 * the light alone says the count is not there yet.
 */
const besideNavigation = `not all and ${folded}`;

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

export const waiting = style({
  "@media": {
    [narrow]: { gap: 0, fontSize: 0 },
    [besideNavigation]: { gap: 0, fontSize: 0 }
  }
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

/**
 * The browser refused the copy: the address shows at every width, ready to be selected. Where
 * the header is short of room it takes the count's place, and two lines only if one will not fit.
 */
export const failed = style({
  // The break between the two lines must not let a crowded header squeeze it at wide widths.
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

/** The count, out of the way of the address after a refused copy. */
export const aside = style({
  "@media": {
    [narrow]: { display: "none" }
  }
});

// Thinner padding leaves room for two lines within the pill's usual height.
globalStyle(`button${pill}:has(${failed}) > span`, {
  "@media": {
    [narrow]: { minHeight: 40, padding: "5px 12px", gap: 8 }
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
