import { globalStyle, style, styleVariants } from "@vanilla-extract/css";
import { media } from "#app/ui/styles/media";
import { font, leading, radius, rem, tracking } from "#app/ui/styles/scale";
import { vars } from "#app/ui/styles/theme.css";

/** Each tag's colour, as Discord colours names, dark enough to read on a tile. */
export const rank = styleVariants({
  owner: { vars: { "--role": "#0f6f68" } },
  developer: { vars: { "--role": "#8a5c00" } },
  admin: { vars: { "--role": "#b3261e" } },
  moderator: { vars: { "--role": "#2353b8" } }
});

/** Small print in the text face: the site's mono is for figures, not for names of things. */
const caption = (weight: number) =>
  `${weight} ${rem(font.caption)} / ${leading.tight} ${vars.fontText}`;

/** A teammate's face on their tile, and the room around it. */
export const FACE = 40;
const INSET = 8;

/**
 * Tiles wide enough for two tags side by side in every language, the longest being French's
 * "Propriétaire" and "Développeur"; they only wrap on a narrow screen or under large text.
 */
export const members = style({
  display: "grid",
  gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${rem(300)}), 1fr))`,
  gap: 6,
  margin: 0,
  padding: 0,
  listStyle: "none"
});

/** The face, the name in their highest tag's colour, and their tags under it. */
export const member = style({
  anchorName: "var(--anchor)",
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  gridTemplateRows: "auto auto",
  alignContent: "center",
  alignItems: "center",
  columnGap: 10,
  width: "100%",
  minHeight: FACE + 2 * INSET,
  // As far from the face on its left as above and below it, for the corners to follow its curve.
  padding: `${INSET}px 14px ${INSET}px ${INSET}px`,
  border: 0,
  borderRadius: FACE / 2 + INSET,
  background: `color-mix(in srgb, ${vars.tile} 70%, transparent)`,
  color: "inherit",
  font: "inherit",
  textAlign: "start",
  cursor: "pointer",
  transition: "background-color 0.15s",
  selectors: {
    "&:hover, &:has(+ :popover-open)": { background: vars.tile },
    "&:focus-visible": { outline: `3px solid ${vars.focus}`, outlineOffset: 2 }
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
  fontWeight: 700,
  textTransform: "uppercase"
});

export const name = style({
  alignSelf: "end",
  minWidth: 0,
  color: "var(--role)",
  fontFamily: vars.fontDisplay,
  fontSize: rem(16),
  fontWeight: 700,
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

/** A tag with a dot of its colour, as Discord shows a role on a profile. */
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

/**
 * Beside its row where the browser can anchor it there, in the middle of the screen where it
 * cannot, and over the bottom of a phone's screen.
 */
export const profile = style({
  width: rem(300),
  maxWidth: "calc(100vw - 32px)",
  // No taller than the screen, as under large text on a phone held sideways: it scrolls instead.
  maxHeight: "calc(100dvh - 16px)",
  padding: "0 16px 18px",
  overflow: "hidden auto",
  overscrollBehavior: "contain",
  border: `2px solid ${vars.outline}`,
  borderRadius: vars.r,
  background: vars.tile,
  color: vars.ink,
  boxShadow: "0 18px 40px rgb(0 0 0 / 0.3)",
  "@supports": {
    "(position-area: right)": {
      positionAnchor: "var(--anchor)",
      positionArea: "right span-bottom",
      // On the other side or upwards where it fits, else over the middle of the screen, as on a
      // phone held sideways. Chromium reads no more than five of these.
      positionTryFallbacks: "flip-inline, flip-block, flip-block flip-inline, span-all",
      inset: "auto",
      margin: "0 10px"
    }
  },
  "@media": {
    [media.motion]: {
      transition:
        "opacity 0.18s, translate 0.18s, display 0.18s allow-discrete, overlay 0.18s allow-discrete"
    }
  },
  selectors: {
    "&:not(:popover-open)": { opacity: 0, translate: "0 6px" },
    "&::backdrop": { background: "transparent" }
  }
});

// After the anchoring above, so a phone's sheet wins over it.
globalStyle(profile, {
  "@media": {
    [media.phone]: {
      positionArea: "none",
      inset: "auto 0 0",
      width: "100%",
      maxWidth: "none",
      margin: 0,
      border: 0,
      borderTop: `2px solid ${vars.outline}`,
      borderRadius: `${vars.r} ${vars.r} 0 0`
    }
  }
});

globalStyle(`${profile}:popover-open`, {
  "@starting-style": { opacity: 0, translate: "0 6px" }
} as never);

globalStyle(`${profile}::backdrop`, {
  "@media": { [media.phone]: { background: "rgb(0 0 0 / 0.4)" } }
});

/** The colour or picture atop a Discord profile, or their highest tag's colour for want of one. */
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
  fontWeight: 700,
  lineHeight: leading.tight,
  letterSpacing: tracking.display,
  overflowWrap: "anywhere"
});

globalStyle(`${profile} ${tags}`, { marginTop: 10 });

/** A line on who they are, which `team.json` gives a few. */
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
  color: "#fff",
  cursor: "pointer",
  selectors: {
    "&:focus-visible": { outline: `3px solid ${vars.focus}`, outlineOffset: 2 }
  }
});

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
  transition: "background-color 0.15s"
});

globalStyle(`${links} a:hover`, {
  background: "color-mix(in srgb, currentColor 18%, transparent)"
});

globalStyle(`${links} a:focus-visible`, {
  outline: `3px solid ${vars.focus}`,
  outlineOffset: 2
});

globalStyle(`${links} svg`, { width: 14, height: 14 });
