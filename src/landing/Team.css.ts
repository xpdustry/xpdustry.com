import { style } from "@vanilla-extract/css";
import { ringOutside } from "#app/ui/styles/focus";
import { media } from "#app/ui/styles/media";
import { leading, rem, tracking } from "#app/ui/styles/scale";
import { role } from "#app/status/Profile.css";
import { vars } from "#app/ui/styles/theme.css";

export const TILE_FACE = 40;
const TILE_INSET = 8;
const TILE_RADIUS = TILE_FACE / 2 + TILE_INSET;
const TWO_TAG_TILE = rem(300);

export const members = style({
  display: "grid",
  gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${TWO_TAG_TILE}), 1fr))`,
  gap: 6,
  margin: 0,
  padding: 0,
  listStyle: "none"
});

export const member = style({
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  gridTemplateRows: "auto auto",
  alignContent: "center",
  alignItems: "center",
  columnGap: 10,
  width: "100%",
  minHeight: TILE_FACE + 2 * TILE_INSET,
  padding: `${TILE_INSET}px 14px ${TILE_INSET}px ${TILE_INSET}px`,
  border: 0,
  borderRadius: TILE_RADIUS,
  background: `color-mix(in srgb, ${vars.tile} 70%, transparent)`,
  color: "inherit",
  font: "inherit",
  textAlign: "start",
  cursor: "pointer",
  transition: "background-color 0.15s",
  selectors: {
    "&:has(+ :popover-open)": { background: vars.tile },
    "&:focus-visible": ringOutside
  },
  "@media": {
    [media.hover]: {
      selectors: { "&:hover": { background: vars.tile } }
    }
  }
});

export const name = style({
  alignSelf: "end",
  minWidth: 0,
  color: role,
  fontFamily: vars.fontDisplay,
  fontSize: rem(16),
  lineHeight: leading.tight,
  letterSpacing: tracking.display,
  overflowWrap: "anywhere"
});
