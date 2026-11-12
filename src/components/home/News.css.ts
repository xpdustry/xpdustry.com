import { style } from "@vanilla-extract/css";
import { media } from "#app/styles/media";
import { cards } from "./shared";

export const posts = cards(92);

export const big = style({
  gridColumn: "span 6",
  gridRow: "span 4",
  "@media": {
    [media.phone]: { minHeight: 400 },
  },
});

export const small = style({
  gridColumn: "span 6",
  gridRow: "span 2",
  "@media": {
    [media.phone]: { minHeight: 240 },
  },
});
