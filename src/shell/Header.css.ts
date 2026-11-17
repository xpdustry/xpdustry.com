import { globalStyle, style } from "@vanilla-extract/css";
import { media, upTo } from "#app/ui/styles/media";
import { reachTouchTarget } from "#app/ui/styles/touch";
import { onDeep } from "./onDeep";
import {
  hangUnder,
  popoverBox,
  popoverMoving,
  popoverPanel,
  popoverShut,
  underParent
} from "./popover";
import { PLINTH_DEPTH, tone, wall } from "#app/ui/Plinth.css";
import { vars } from "#app/ui/styles/theme.css";

export const navFolded = upTo(1160);
export const controlsFolded = upTo(520);
const navUnfolded = `not all and ${navFolded}`;

const ANCHOR = "--site-menu";
const BRAND = "--site-brand";

const below = `calc(${vars.group} * 0.55)`;

export const header = style({
  ...onDeep,
  position: "relative",
  zIndex: 5,
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "10px 22px",
  padding: `6px 6px ${below}`,
  "@media": {
    [controlsFolded]: { columnGap: 10 }
  }
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
  marginRight: "auto",
  anchorName: BRAND
});

globalStyle(`${brand} span`, {
  "@media": {
    [media.small]: {
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
  flex: "1 1 0",
  flexWrap: "wrap",
  gap: 6,
  marginLeft: 4,
  padding: 0,
  border: 0,
  background: "none",
  "@media": {
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
    },
    [`${navFolded} and ${media.motion}`]: {
      selectors: popoverMoving
    }
  }
});

globalStyle(`${nav} > a > span`, {
  padding: "7px 20px",
  "@media": {
    [navFolded]: { flex: 1, padding: "10px 14px" }
  }
});

const end = style({
  selectors: {
    [`${header} &`]: { marginLeft: -12 }
  }
});

globalStyle(`${header} ${end} > span`, {
  padding: 9
});

export const play = style({
  selectors: {
    [`${header} &`]: { marginLeft: "auto" }
  }
});

globalStyle(`${header} ${play} > span`, {
  gap: 10,
  padding: "10px 13px 10px 14px"
});

export const language = style({
  selectors: {
    [`${header} &`]: { marginLeft: "auto" },
    [`${header} ${play} ~ &`]: { marginLeft: -12 }
  },
  "@media": {
    [controlsFolded]: { display: "none" }
  }
});

export const languages = style({
  display: "none",
  "@media": {
    [controlsFolded]: {
      display: "flex",
      paddingTop: 10,
      borderTop: `2px solid ${vars.deepWall}`
    }
  }
});

export const github = style([
  end,
  {
    "@media": {
      [controlsFolded]: {
        selectors: { [`${header} &`]: { display: "none" } }
      }
    }
  }
]);

export const toggle = style([
  end,
  {
    anchorName: ANCHOR,
    selectors: {
      [`${header} &`]: { display: "none" }
    },
    "@media": {
      [navFolded]: {
        selectors: { [`${header} &`]: { order: 1, display: "inline-flex" } }
      },
      [controlsFolded]: {
        selectors: {
          [`${header} &`]: { marginLeft: "auto" },
          [`${header}:has(${play}) &`]: { marginLeft: 0 }
        }
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

const plinthFaceCentredAboveItsBoxBy = PLINTH_DEPTH / 2;

for (const plinth of [toggle, play, `${language} > button`, github]) {
  reachTouchTarget(plinth, plinthFaceCentredAboveItsBoxBy);
}
reachTouchTarget(brand);
