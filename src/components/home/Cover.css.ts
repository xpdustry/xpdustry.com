import { style } from "@vanilla-extract/css";
import { media } from "#app/ui/styles/media";
import { cards } from "./shared";

export const cover = cards(92);

export const hero = style({
  gridColumn: "span 7",
  gridRow: "span 4",
  "@media": {
    [media.tablet]: { gridColumn: "span 6" }
  }
});

export const side = style({
  gridColumn: "span 5",
  gridRow: "span 2",
  "@media": {
    [media.tablet]: { gridColumn: "span 3" }
  }
});
