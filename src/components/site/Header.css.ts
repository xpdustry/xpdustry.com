import { globalStyle, style } from "@vanilla-extract/css";
import { onDeep } from "#app/components/site/deep";
import { media, upTo } from "#app/styles/media";
import { radius } from "#app/styles/scale";
import { tone, wall } from "#app/components/ui/Plinth.css";
import { vars } from "#app/styles/theme.css";

const folded = upTo(1240);
const narrow = upTo(520);

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

globalStyle(`${header} ${tone.ink}`, {
  vars: { [wall]: vars.deepWall },
});

globalStyle(`${header} svg`, {
  flex: "none",
});

export const brand = style({});

globalStyle(`${brand} span`, {
  "@media": {
    [media.small]: {
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

globalStyle(`${header} ${play} > span`, {
  gap: 10,
  padding: "10px 13px 10px 14px",
});

const end = style({
  selectors: {
    [`${header} &`]: { marginLeft: -12 },
  },
});

globalStyle(`${header} ${end} > span`, {
  padding: 9,
});

export const language = style({
  selectors: {
    [`${header} &`]: { marginLeft: -12 },
  },
  "@media": {
    [narrow]: { display: "none" },
  },
});

export const languages = style({
  display: "none",
  "@media": {
    [narrow]: {
      display: "flex",
      paddingTop: 10,
      borderTop: `2px solid ${vars.deepWall}`,
    },
  },
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
