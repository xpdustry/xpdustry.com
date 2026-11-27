import { globalStyle, style } from "@vanilla-extract/css";
import { media, upTo } from "#app/ui/styles/media";
import { font, leading, radius, rem } from "#app/ui/styles/scale";
import {
  hangUnder,
  popoverBox,
  popoverMoving,
  popoverPanel,
  popoverShut,
  underParent
} from "./popover";
import { vars } from "#app/ui/styles/theme.css";

export const wrapper = style({
  position: "relative",
  display: "flex"
});

const ANCHOR = "--locale-switch";

export const button = style({
  anchorName: ANCHOR
});

globalStyle(`${button} > span`, {
  gap: 9,
  minHeight: 40,
  padding: "7px 12px",
  fontFamily: vars.fontText,
  fontSize: rem(font.small),
  fontWeight: 500,
  lineHeight: leading.snug,
  "@container": {
    [upTo(572)]: { padding: 9 }
  }
});

globalStyle(`${button} > span > svg:last-child`, {
  width: 14,
  height: 14,
  color: vars.muted
});

globalStyle(`${button} > span > :is(span, svg:last-child)`, {
  "@container": {
    [upTo(572)]: { display: "none" }
  }
});

export const list = style({
  display: "flex",
  flexDirection: "column",
  gap: 2
});

const hung = hangUnder(ANCHOR, underParent(0));

export const panel = style({
  ...popoverBox,
  position: "absolute",
  ...hung.shut,
  zIndex: 6,
  ...popoverShut,
  minWidth: 170,
  padding: 8,
  ...popoverPanel,
  selectors: hung.shown,
  "@media": {
    [media.motion]: {
      selectors: popoverMoving
    }
  }
});

export const option = style({
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  padding: "9px 10px",
  color: "inherit",
  textDecoration: "none",
  border: 0,
  borderRadius: radius.sm,
  background: "none",
  fontSize: rem(font.small),
  textAlign: "start",
  cursor: "pointer",
  selectors: {
    '&[aria-current="true"]': { color: vars.t9, cursor: "default" }
  },
  "@media": {
    [media.coarse]: { paddingBlock: 11 },
    [media.hover]: {
      selectors: { "&:hover": { background: "rgb(255 255 255 / 0.08)" } }
    }
  }
});

export const tick = style({
  width: 16,
  height: 16,
  marginLeft: "auto"
});
