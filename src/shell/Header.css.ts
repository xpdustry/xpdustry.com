import { globalStyle, style } from "@vanilla-extract/css";
import { media, upTo } from "#app/ui/styles/media";
import { reachTouchTarget } from "#app/ui/styles/touch";
import {
  hangUnder,
  popoverBox,
  popoverMoving,
  popoverPanel,
  popoverShut,
  underParent
} from "./popover";
import { PLINTH_CENTRED_ABOVE_ITS_BOX_BY, tone, wall } from "#app/ui/Plinth.css";
import { vars } from "#app/ui/styles/theme.css";

const navFolded = upTo(1008);
const controlsFolded = upTo(572);
const brandWordFolded = upTo(383);
const navUnfolded = `not ${navFolded}`;

const ANCHOR = "--site-menu";
const BRAND = "--site-brand";

const below = `calc(${vars.group} * 0.55)`;

export const header = style({
  containerType: "inline-size",
  color: vars.onDeep,
  position: "relative",
  zIndex: 5,
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: `6px 6px ${below}`
});

globalStyle(`${header} ${tone.ink}`, {
  vars: { [wall]: vars.deepWall }
});

globalStyle(`${header} svg`, {
  flex: "none"
});

export const brand = style({
  position: "relative",
  flex: "none",
  anchorName: BRAND
});

globalStyle(`${brand} span`, {
  "@container": {
    [brandWordFolded]: {
      position: "absolute",
      width: 1,
      height: 1,
      overflow: "hidden",
      clipPath: "inset(50%)",
      whiteSpace: "nowrap"
    }
  }
});

const menuLeftOpenWithoutScripts = {
  position: "absolute",
  top: `anchor(${BRAND} center)`,
  left: `calc(anchor(${BRAND} right) + 22px)`,
  translate: "0 -50%"
} as const;

const menuHung = hangUnder(ANCHOR, underParent(6, below));

export const nav = style({
  ...popoverBox,
  position: "static",
  display: "flex",
  flex: "none",
  gap: 6,
  marginInline: "16px 12px",
  padding: 0,
  border: 0,
  background: "none",
  "@container": {
    [navFolded]: {
      position: "absolute",
      ...menuHung.shut,
      ...popoverShut,
      flexDirection: "column",
      gap: 10,
      minWidth: 210,
      margin: 0,
      padding: "12px 12px 14px",
      ...popoverPanel,
      selectors: menuHung.shown
    },
    [navUnfolded]: {
      selectors: { "&:popover-open": menuLeftOpenWithoutScripts }
    }
  },
  "@media": {
    [media.motion]: {
      "@container": {
        [navFolded]: { selectors: popoverMoving }
      }
    }
  }
});

globalStyle(`${nav} > a > span`, {
  padding: "7px 20px",
  "@container": {
    [navFolded]: { flex: 1, padding: "10px 14px" }
  }
});

const iconControl = style({});

globalStyle(`${header} ${iconControl} > span`, {
  padding: 9
});

export const play = style({
  display: "flex",
  flex: "1 1 0",
  justifyContent: "flex-end",
  minWidth: 0
});

export const language = style({
  marginLeft: "auto"
});

export const github = style([
  iconControl,
  {
    "@container": {
      [controlsFolded]: {
        selectors: { [`${header} &`]: { display: "none" } }
      }
    }
  }
]);

export const toggle = style([
  iconControl,
  {
    anchorName: ANCHOR,
    selectors: {
      [`${header} &`]: { display: "none" }
    },
    "@container": {
      [navFolded]: {
        selectors: { [`${header} &`]: { order: 1, display: "inline-flex" } }
      }
    }
  }
]);

export const whenShut = style({
  selectors: {
    [`${header}:has(${nav}:popover-open) &`]: { display: "none" }
  }
});

export const whenOpen = style({
  selectors: {
    [`${header}:not(:has(${nav}:popover-open)) &`]: { display: "none" }
  }
});

for (const plinth of [toggle, `${language} > button`, github]) {
  reachTouchTarget(plinth, PLINTH_CENTRED_ABOVE_ITS_BOX_BY);
}
reachTouchTarget(brand);
