import { globalStyle, style } from "@vanilla-extract/css";
import { media } from "#app/ui/styles/media";
import { radius } from "#app/ui/styles/scale";
import { onDeep } from "./onDeep";
import {
  popoverBox,
  popoverFallbackPlace,
  popoverMoving,
  popoverOpen,
  popoverShut
} from "./popover";
import { tone, wall } from "#app/ui/Plinth.css";
import { vars } from "#app/ui/styles/theme.css";

/*
 * In em, which media queries take from the browser's text size rather than the page's: text
 * enlarged on its own, as Firefox's text-only zoom does, folds the header sooner. At the usual 16px
 * these are 1240px and 520px.
 */
/** Where the navigation folds into the menu. */
export const folded = "(max-width: 77.5em)";
/** Where the language button and GitHub fold into the menu too. */
export const narrow = "(max-width: 32.5em)";

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
    [narrow]: { columnGap: 10 }
  }
});

globalStyle(`${header} ${tone.ink}`, {
  vars: { [wall]: vars.deepWall }
});

globalStyle(`${header} svg`, {
  flex: "none"
});

/** Its margin keeps the controls at the right, as does the header's end alignment once they wrap. */
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

const top = `calc(anchor(${ANCHOR} bottom) + 10px)`;
const right = `anchor(${ANCHOR} right)`;

/**
 * Where it sits in the header, the navigation takes the room left, and only needs its widest link:
 * enlarged or spaced text wraps its links, then moves the controls after it to a line of their own,
 * instead of pushing them off the screen.
 */
export const nav = style({
  ...popoverBox,
  position: "static",
  display: "flex",
  flex: "1 1 0",
  flexWrap: "wrap",
  gap: 8,
  marginLeft: 12,
  padding: 0,
  border: 0,
  background: "none",
  "@media": {
    [folded]: {
      position: "absolute",
      top: [`calc(100% - ${below} + 10px)`, top],
      right: [6, right],
      ...popoverShut,
      flexDirection: "column",
      gap: 10,
      minWidth: 210,
      margin: 0,
      padding: "12px 12px 14px",
      border: `2px solid ${vars.deepWall}`,
      borderRadius: radius.lg,
      background: vars.deep,
      boxShadow: "0 18px 40px -12px rgb(0 0 0 / 0.55)",
      selectors: {
        "&:popover-open": {
          ...popoverOpen,
          top: [popoverFallbackPlace.top, top],
          right: [popoverFallbackPlace.right, right]
        }
      }
    },
    /*
     * Without JavaScript nothing shuts a menu left open while the window widens past the fold, and
     * the browser keeps it in the top layer: it is held where it would sit in the header.
     */
    [`not all and ${folded}`]: {
      selectors: {
        "&:popover-open": {
          position: "absolute",
          top: `anchor(${BRAND} center)`,
          left: `calc(anchor(${BRAND} right) + 22px)`,
          translate: "0 -50%"
        }
      }
    },
    [`${folded} and ${media.motion}`]: {
      selectors: popoverMoving
    }
  }
});

globalStyle(`${nav} > a > span`, {
  padding: "7px 14px",
  "@media": {
    [folded]: { flex: 1, padding: "10px 14px" }
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
    [narrow]: { display: "none" }
  }
});

export const languages = style({
  display: "none",
  "@media": {
    [narrow]: {
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
      [narrow]: {
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
      [folded]: {
        selectors: { [`${header} &`]: { order: 1, display: "inline-flex" } }
      },
      [narrow]: {
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

/**
 * On a touch screen every control in the header takes a press over at least 44px square, though
 * it draws 40px: the hit area covers the 4px the face rises above its box, and 2px to each side.
 * The insets count from inside the plinth's 2px border.
 */
globalStyle(`${toggle}::after, ${play}::after, ${language} > button::after, ${github}::after`, {
  "@media": {
    [media.coarse]: { content: '""', position: "absolute", inset: "-6px -4px -2px" }
  }
});

globalStyle(`${brand}::after`, {
  "@media": {
    [media.coarse]: { content: '""', position: "absolute", inset: -2 }
  }
});
