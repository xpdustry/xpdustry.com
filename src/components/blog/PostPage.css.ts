import { style } from "@vanilla-extract/css";
import { media, upTo } from "#app/styles/media";
import { vars } from "#app/styles/theme.css";

const threeUp = upTo(900);

export const post = style({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 320px",
  alignItems: "start",
  gap: vars.gap,
  "@media": {
    [media.tablet]: { gridTemplateColumns: "minmax(0, 1fr)" },
  },
});

export const cover = style({
  gridColumn: "1 / -1",
});

export const article = style({
  display: "grid",
  alignSelf: "stretch",
  minWidth: 0,
  gridTemplateColumns: "subgrid",
  gridTemplateRows: "subgrid",
  gridColumn: "1 / -1",
  gridRow: "1 / 3",
});

export const aside = style({
  gridColumn: 2,
  gridRow: 2,
  "@media": {
    [media.tablet]: { gridColumn: 1, gridRow: 3 },
  },
});

export const body = style({
  alignSelf: "start",
  gridColumn: 1,
  minWidth: 0,
  padding: "44px 52px 52px",
  "@media": {
    [media.phone]: { padding: "28px 22px" },
  },
});

export const more = style({
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: vars.gap,
  "@media": {
    [threeUp]: { gridTemplateColumns: "1fr" },
  },
});

export const tile = style({
  minHeight: 230,
  "@media": {
    [threeUp]: { minHeight: 200 },
  },
});
