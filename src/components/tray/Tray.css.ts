import { createVar, globalStyle, style } from "@vanilla-extract/css";
import { media, upTo } from "#app/styles/media";
import { font, leading, radius, tracking } from "#app/styles/scale";
import { vars } from "#app/styles/theme.css";

const tabWidth = createVar();
const trayR = createVar();

const trayWidth = createVar();

const cramped = "(width < 273px)";

const narrow = upTo(700);
const tiny = upTo(360);

const slantHalf = "31.5px";

export const tray = style({
  vars: {
    [tabWidth]: "484px",
    [trayR]: `calc(${vars.r} + ${vars.gap})`,
    [trayWidth]: `calc(100cqw + 2 * ${vars.gap})`,
  },
  position: "relative",
  isolation: "isolate",
  containerType: "inline-size",
  marginTop: `calc(71px + ${vars.group})`,
  padding: vars.gap,
  scrollMarginTop: 70,
  "@media": {
    [narrow]: { vars: { [tabWidth]: "331px" } },
    [media.phone]: { vars: { [tabWidth]: "293px" } },
    [media.small]: { vars: { [tabWidth]: "245px" } },
    [tiny]: { vars: { [tabWidth]: "232px" } },
  },
});

export const body = style({
  position: "absolute",
  inset: 0,
  zIndex: -1,
  border: `2px solid ${vars.outline}`,
  borderRadius: `0 clamp(0px, ${trayWidth} - ${tabWidth} - ${slantHalf}, ${trayR}) ${trayR} ${trayR}`,
  background: vars.tray,
  "@container": {
    [cramped]: { borderTopRightRadius: 0 },
  },
});

export const tab = style({
  position: "absolute",
  bottom: "calc(100% - 2px)",
  left: 0,
  display: "flex",
  alignItems: "center",
  gap: 14,
  width: tabWidth,
  maxWidth: "100%",
  height: 72,
  padding: "11px 44px 3px 14px",
  borderRadius: `${vars.r} ${vars.r} 0 0`,
  "::before": {
    content: '""',
    position: "absolute",
    inset: `0 ${slantHalf} 0 0`,
    zIndex: -1,
    border: `solid ${vars.outline}`,
    borderWidth: "2px 0 0 2px",
    borderRadius: `${vars.r} 0 0`,
    background: vars.tray,
  },
  "@container": {
    [cramped]: {
      width: "100%",
      paddingRight: 14,
      selectors: {
        "&::before": {
          right: "auto",
          width: trayWidth,
          borderRightWidth: 2,
          borderTopRightRadius: vars.r,
        },
      },
    },
  },
  "@media": {
    [media.phone]: { gap: 10, paddingLeft: 10 },
    [media.small]: { paddingLeft: 16 },
  },
});

export const slant = style({
  position: "absolute",
  top: 0,
  left: `calc(100% - ${slantHalf})`,
  zIndex: -1,
  overflow: "visible",
  pointerEvents: "none",
  "@container": {
    [cramped]: { display: "none" },
  },
});

export const face = style({
  fill: vars.tray,
});

export const line = style({
  fill: "none",
  stroke: vars.outline,
  strokeWidth: 2,
});

export const icon = style({
  flex: "none",
  display: "grid",
  placeItems: "center",
  width: 46,
  height: 46,
  border: `2px solid ${vars.outline}`,
  borderRadius: radius.md,
  background: vars.tile,
  "@media": {
    [media.phone]: { width: 40, height: 40 },
    [media.small]: { display: "none" },
  },
});

globalStyle(`${icon} svg`, {
  width: 26,
  height: 26,
  "@media": {
    [media.phone]: { width: 22, height: 22 },
  },
});

export const titles = style({
  display: "grid",
  gap: 4,
  minWidth: 0,
});

globalStyle(`${titles} h2`, {
  fontSize: font.h3,
  lineHeight: leading.tight,
  letterSpacing: tracking.heading,
  whiteSpace: "nowrap",
  "@media": {
    [media.phone]: { fontSize: font.h4 },
  },
});

export const subtitle = style({
  overflow: "hidden",
  fontSize: font.caption,
  color: vars.muted,
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  "@media": {
    [narrow]: { display: "none" },
  },
});

export const action = style({
  selectors: {
    [`${tab} > &`]: {
      position: "static",
      flex: "none",
      marginLeft: "auto",
    },
    [`${tab} > &::after`]: {
      content: '""',
      position: "absolute",
      inset: "0 0 -2px",
      borderRadius: `${vars.r} ${vars.r} 0 0`,
    },
    [`${tab} > &:focus-visible`]: {
      outline: "none",
    },
  },
});

globalStyle(`${tab}:has(> ${action}) ${titles}`, {
  marginRight: 4,
});

globalStyle(`${tab} > ${action} > span`, {
  padding: 7,
});

globalStyle(`${tab}:has(> ${action}:focus-visible)`, {
  outline: `3px solid ${vars.t9}`,
  outlineOffset: 2,
});

globalStyle(`${tab}:has(> ${action})`, {
  "@media": {
    [media.phone]: { gap: 14 },
  },
});
