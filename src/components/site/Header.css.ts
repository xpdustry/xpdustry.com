import { globalStyle, style } from "@vanilla-extract/css";
import { onDeep } from "#app/components/site/deep";
import { upTo } from "#app/styles/media";
import { radius } from "#app/styles/scale";
import { tone, wall } from "#app/components/ui/Plinth.css";
import { vars } from "#app/styles/theme.css";

/**
 * Narrower, the pages wait in a panel under the menu button: the brand, the pages, the play pill
 * and the GitHub button need about 1230px in a row.
 */
const folded = upTo(1240);
/** No room left for the GitHub button. */
const narrow = upTo(520);
/** A phone: the mark stands for the name. */
const small = upTo(430);

/** The room under the header, which the open panel reaches into. */
const below = `calc(${vars.group} * 0.55)`;

export const header = style({
  ...onDeep,
  position: "relative",
  zIndex: 5,
  display: "flex",
  alignItems: "center",
  gap: "10px 22px",
  padding: `6px 6px ${below}`,
  "@media": {
    [narrow]: { columnGap: 10 },
  },
});

// on the deep teal, a white plinth's wall in the page's outline colour would vanish
globalStyle(`${header} ${tone.ink}`, {
  vars: { [wall]: vars.deepWall },
});

// an icon never gives up its room to the text beside it
globalStyle(`${header} svg`, {
  flex: "none",
});

export const brand = style({});

// the brand's name still names the link
globalStyle(`${brand} span`, {
  "@media": {
    [small]: {
      position: "absolute",
      width: 1,
      height: 1,
      overflow: "hidden",
      clipPath: "inset(50%)",
      whiteSpace: "nowrap",
    },
  },
});

export const nav = style({
  display: "flex",
  gap: 8,
  marginLeft: 12,
  "@media": {
    [folded]: {
      position: "absolute",
      top: `calc(100% - ${below} + 10px)`,
      right: 6,
      display: "none",
      flexDirection: "column",
      gap: 10,
      minWidth: 210,
      margin: 0,
      padding: "12px 12px 14px",
      border: `2px solid ${vars.deepWall}`,
      borderRadius: radius.lg,
      background: vars.deep,
      boxShadow: "0 18px 40px -12px rgb(0 0 0 / 0.55)",
    },
  },
});

export const open = style({
  "@media": {
    [folded]: {
      selectors: {
        [`${nav}&`]: { display: "flex" },
      },
    },
  },
});

globalStyle(`${nav} > a > span`, {
  padding: "7px 14px",
  "@media": {
    [folded]: { flex: 1, padding: "10px 14px" },
  },
});

export const play = style({
  selectors: {
    [`${header} &`]: { marginLeft: "auto" },
  },
});

// as tall as the nav beside it
globalStyle(`${header} ${play} > span`, {
  gap: 10,
  padding: "10px 13px 10px 14px",
});

/** The icon buttons at the end, which keep closer company than the header's groups do. */
const end = style({
  selectors: {
    [`${header} &`]: { marginLeft: -12 },
  },
});

globalStyle(`${header} ${end} > span`, {
  padding: 9,
});

export const github = style([
  end,
  {
    "@media": {
      [narrow]: {
        selectors: { [`${header} &`]: { display: "none" } },
      },
    },
  },
]);

export const toggle = style([
  end,
  {
    selectors: {
      [`${header} &`]: { display: "none" },
    },
    "@media": {
      [folded]: {
        selectors: { [`${header} &`]: { order: 1, display: "inline-flex" } },
      },
      [narrow]: {
        selectors: { [`${header} &`]: { marginLeft: 0 } },
      },
    },
  },
]);
