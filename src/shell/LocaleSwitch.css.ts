import { globalStyle, style } from "@vanilla-extract/css";
import { media } from "#app/ui/styles/media";
import { font, leading, radius, rem } from "#app/ui/styles/scale";
import {
  hangUnder,
  popoverBox,
  popoverMoving,
  popoverOpenUnder,
  popoverPanel,
  popoverShut
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
  lineHeight: leading.snug
});

globalStyle(`${button} > span > svg:last-child`, {
  width: 14,
  height: 14,
  color: vars.muted
});

export const list = style({
  display: "flex",
  flexDirection: "column",
  gap: 2
});

const hung = hangUnder(ANCHOR);

export const panel = style({
  ...popoverBox,
  position: "absolute",
  top: ["calc(100% + 10px)", hung.top],
  right: [0, hung.right],
  zIndex: 6,
  ...popoverShut,
  minWidth: 170,
  padding: 8,
  ...popoverPanel,
  selectors: popoverOpenUnder(hung),
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
    "&:hover": { background: "rgb(255 255 255 / 0.08)" },
    '&[aria-current="true"]': { color: vars.t9, cursor: "default" }
  },
  "@media": {
    [media.coarse]: { paddingBlock: 11 }
  }
});

export const tick = style({
  width: 16,
  height: 16,
  marginLeft: "auto"
});
