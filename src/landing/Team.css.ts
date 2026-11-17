import { globalStyle, style, styleVariants } from "@vanilla-extract/css";
import { movingPopover, shownPopover, shutPopover } from "#app/ui/popoverMotion";
import { media } from "#app/ui/styles/media";
import { font, leading, radius, rem, tracking } from "#app/ui/styles/scale";
import { reachTouchTarget, touchTargetHeight } from "#app/ui/styles/touch";
import { vars } from "#app/ui/styles/theme.css";

export const roleColour = styleVariants({
  owner: { vars: { "--role": "#0f6f68" } },
  developer: { vars: { "--role": "#8a5c00" } },
  admin: { vars: { "--role": "#b3261e" } },
  moderator: { vars: { "--role": "#2353b8" } }
});

const caption = (weight: number) =>
  `${weight} ${rem(font.caption)} / ${leading.tight} ${vars.fontText}`;

export const TILE_FACE = 40;
const TILE_INSET = 8;
const TILE_RADIUS = TILE_FACE / 2 + TILE_INSET;
const TWO_TAG_TILE = rem(300);
export const PROFILE_FACE = 80;

export const members = style({
  display: "grid",
  gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${TWO_TAG_TILE}), 1fr))`,
  gap: 6,
  margin: 0,
  padding: 0,
  listStyle: "none"
});

export const member = style({
  anchorName: "var(--anchor)",
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
    "&:focus-visible": { outline: `3px solid ${vars.focus}`, outlineOffset: 2 }
  },
  "@media": {
    [media.hover]: {
      selectors: { "&:hover": { background: vars.tile } }
    }
  }
});

export const face = style({
  gridRow: "span 2",
  display: "grid",
  placeItems: "center",
  borderRadius: "50%",
  objectFit: "cover",
  background: vars.deep,
  color: vars.onDeep,
  fontFamily: vars.fontDisplay,
  textTransform: "uppercase"
});

export const name = style({
  alignSelf: "end",
  minWidth: 0,
  color: "var(--role)",
  fontFamily: vars.fontDisplay,
  fontSize: rem(16),
  lineHeight: leading.tight,
  letterSpacing: tracking.display,
  overflowWrap: "anywhere"
});

export const tags = style({
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
  marginTop: 4
});

export const tag = style({
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "2px 8px 2px 6px",
  borderRadius: radius.pill,
  background: "color-mix(in srgb, currentColor 8%, transparent)",
  font: caption(600),
  selectors: {
    "&::before": {
      content: '""',
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: "var(--role)"
    }
  }
});

const profileShut = { ...shutPopover, translate: "0 6px" };

export const profile = style({
  ...profileShut,
  width: rem(300),
  maxWidth: "calc(100vw - 32px)",
  maxHeight: "calc(100dvh - 16px)",
  padding: "0 16px 18px",
  overflow: "hidden auto",
  overscrollBehavior: "contain",
  border: `2px solid ${vars.outline}`,
  borderRadius: vars.r,
  background: vars.tile,
  color: vars.ink,
  boxShadow: "0 18px 40px rgb(0 0 0 / 0.3)",
  "@media": {
    [`not ${media.phone}`]: {
      "@supports": {
        "(position-area: right)": {
          positionAnchor: "var(--anchor)",
          positionArea: "right span-bottom",
          positionTryFallbacks: "flip-inline, flip-block, flip-block flip-inline, span-all",
          inset: "auto",
          margin: "0 10px"
        }
      }
    },
    [media.phone]: {
      inset: "auto 0 0",
      width: "100%",
      maxWidth: "none",
      margin: 0,
      border: 0,
      borderTop: `2px solid ${vars.outline}`,
      borderRadius: `${vars.r} ${vars.r} 0 0`
    },
    [media.motion]: {
      selectors: movingPopover(["opacity", "translate"], "ease", { display: "block" })
    }
  },
  selectors: {
    "&:popover-open": { ...shownPopover, translate: "0", "@starting-style": profileShut },
    "&::backdrop": { background: "transparent" }
  }
});

globalStyle(`${profile}::backdrop`, {
  "@media": { [media.phone]: { background: "rgb(0 0 0 / 0.4)" } }
});

export const banner = style({
  height: 96,
  margin: "0 -16px",
  backgroundColor: "var(--role)",
  backgroundPosition: "center",
  backgroundSize: "cover"
});

globalStyle(`${profile} ${face}`, {
  marginTop: -44,
  border: `5px solid ${vars.tile}`,
  boxSizing: "content-box"
});

export const title = style({
  marginTop: 8,
  fontFamily: vars.fontDisplay,
  fontSize: rem(22),
  lineHeight: leading.tight,
  letterSpacing: tracking.display,
  overflowWrap: "anywhere"
});

globalStyle(`${profile} ${tags}`, { marginTop: 10 });

export const about = style({
  marginTop: 12,
  color: vars.muted,
  fontFamily: vars.fontText,
  fontSize: rem(font.small),
  fontWeight: 500,
  lineHeight: leading.snug,
  overflowWrap: "anywhere"
});

export const close = style({
  position: "absolute",
  top: 10,
  right: 10,
  display: "grid",
  placeItems: "center",
  width: 32,
  height: 32,
  border: 0,
  borderRadius: "50%",
  background: "rgb(0 0 0 / 0.45)",
  color: vars.onGround,
  cursor: "pointer",
  selectors: {
    "&:focus-visible": { outline: `3px solid ${vars.focus}`, outlineOffset: 2 }
  }
});

reachTouchTarget(close);

globalStyle(`${close} svg`, { width: 14, height: 14 });

export const links = style({
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  marginTop: 14,
  selectors: { "&:empty": { display: "none" } }
});

globalStyle(`${links} a`, {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "5px 9px",
  borderRadius: radius.sm,
  background: "color-mix(in srgb, currentColor 10%, transparent)",
  color: "inherit",
  font: caption(600),
  textDecoration: "none",
  overflowWrap: "anywhere",
  transition: "background-color 0.15s",
  ...touchTargetHeight
});

globalStyle(`${links} a:hover`, {
  "@media": {
    [media.hover]: { background: "color-mix(in srgb, currentColor 18%, transparent)" }
  }
});

globalStyle(`${links} a:focus-visible`, {
  outline: `3px solid ${vars.focus}`,
  outlineOffset: 2
});

globalStyle(`${links} svg`, { width: 14, height: 14 });
