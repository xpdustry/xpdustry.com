import { globalStyle, style } from "@vanilla-extract/css";
import {
  popoverBox,
  popoverFallbackPlace,
  popoverMoving,
  popoverOpen,
  popoverShut,
} from "#app/components/site/popover";
import { media } from "#app/styles/media";
import { font, leading, radius } from "#app/styles/scale";
import { vars } from "#app/styles/theme.css";

export const wrapper = style({
  position: "relative",
  display: "flex",
});

const code = {
  font: `500 ${font.caption}px / ${leading.tight} ${vars.fontMono}`,
  textTransform: "uppercase",
} as const;

const ANCHOR = "--locale-switch";

export const button = style({
  anchorName: ANCHOR,
});

globalStyle(`${button} > span`, {
  ...code,
  display: "grid",
  placeItems: "center",
  width: 40,
  height: 40,
  padding: 0,
});

export const list = style({
  display: "flex",
  flexDirection: "column",
  gap: 2,
});

const top = `calc(anchor(${ANCHOR} bottom) + 10px)`;
const right = `anchor(${ANCHOR} right)`;

export const panel = style({
  ...popoverBox,
  position: "absolute",
  top: ["calc(100% + 10px)", top],
  right: [0, right],
  zIndex: 6,
  ...popoverShut,
  minWidth: 170,
  padding: 8,
  border: `2px solid ${vars.deepWall}`,
  borderRadius: radius.lg,
  background: vars.deep,
  boxShadow: "0 18px 40px -12px rgb(0 0 0 / 0.55)",
  selectors: {
    "&:popover-open": {
      ...popoverOpen,
      top: [popoverFallbackPlace.top, top],
      right: [popoverFallbackPlace.right, right],
    },
  },
  "@media": {
    [media.motion]: {
      selectors: popoverMoving,
    },
  },
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
  fontSize: font.small,
  textAlign: "start",
  cursor: "pointer",
  selectors: {
    "&:hover": { background: "rgb(255 255 255 / 0.08)" },
    '&[aria-current="true"]': { color: vars.t9, cursor: "default" },
  },
  "@media": {
    [media.coarse]: { paddingBlock: 11 },
  },
});

export const codeLabel = style({
  ...code,
  minWidth: "2ch",
  color: vars.deepInk,
});

export { codeLabel as code };

export const tick = style({
  width: 16,
  height: 16,
  marginLeft: "auto",
});
