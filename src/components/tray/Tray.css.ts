import { createVar, globalStyle, style } from "@vanilla-extract/css";
import { media, upTo } from "#app/styles/media";
import { font, leading, radius, tracking } from "#app/styles/scale";
import { vars } from "#app/styles/theme.css";

/** The widest tab's width, which every tab takes so their buttons line up. */
const tabWidth = createVar();
/** Round the cards inside it, at a gap's distance. */
const trayR = createVar();

/** The tray's width; a container's own size is its content box's. */
const trayWidth = createVar();

/** The narrowest tab that has a shelf, plus a slant and a shelf, less the tray's padding. */
const cramped = "(width < 273px)";

/** The titles' widths step down with the type, so the tab keeps a shelf beside it. */
const narrow = upTo(700);
/** No room left for the icon. */
const small = upTo(430);
/** The smallest phones: the tab shrinks around the titles once more. */
const tiny = upTo(360);

// the slant is centred on the tab's right edge
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
  // the tab stands in the margin
  marginTop: `calc(71px + ${vars.group})`,
  padding: vars.gap,
  // a link to the tray lands on its tab
  scrollMarginTop: 70,
  "@media": {
    [narrow]: { vars: { [tabWidth]: "331px" } },
    [media.phone]: { vars: { [tabWidth]: "293px" } },
    [small]: { vars: { [tabWidth]: "245px" } },
    [tiny]: { vars: { [tabWidth]: "232px" } },
  },
});

/** The tray, its top-right corner tightening when the shelf beside the tab is short. */
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
  // the tab up to its slant, over the tray's top edge
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
    // too little shelf beside the tab reads as a glitch: the tab runs into the tray's side instead
    [cramped]: {
      // with no slant to keep clear of, the tab is the tray's whole top and its button its corner's
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
    [small]: { paddingLeft: 16 },
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
    [small]: { display: "none" },
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

/** The tab's button, which the whole tab answers to. */
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
