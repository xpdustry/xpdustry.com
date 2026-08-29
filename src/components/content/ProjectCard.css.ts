import { style } from "@vanilla-extract/css";
import logoMonochrome from "#app/assets/logo-monochrome.svg";
import { colors, leading, media, radii, space, type, weight } from "#app/styles/theme.css";

export const face = style({
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
  gap: space.three,
  overflow: "hidden",
  padding: space.six,
  textAlign: "left",
});

export const heading = style({ display: "flex", alignItems: "center", gap: space.four });

export const mark = style({
  display: "grid",
  width: "3.5rem",
  height: "3.5rem",
  flexShrink: 0,
  placeItems: "center",
  padding: space.two,
  borderWidth: "2px",
  borderStyle: "solid",
  borderColor: colors.lineSoft,
  borderRadius: radii.xl,
  backgroundColor: colors.pageSunk,
});

export const image = style({ maxWidth: "100%", maxHeight: "100%" });

export const fallbackImage = style({
  width: "100%",
  height: "100%",
  backgroundColor: colors.ink,
  maskImage: `url("${logoMonochrome}")`,
  maskPosition: "center",
  maskRepeat: "no-repeat",
  maskSize: "contain",
});

export const title = style({
  color: colors.ink,
  fontSize: type.xl,
  fontWeight: weight.bold,
  lineHeight: leading.xl,
  "@media": { [media.sm]: { fontSize: type.twoXl, lineHeight: leading.twoXl } },
});

export const summary = style({ color: colors.inkMuted, fontSize: type.sm });
