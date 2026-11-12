import type { StyleRule } from "@vanilla-extract/css";
import { media } from "./media";
import { font, leading, rem, tracking } from "./scale";

/** The type of a page's or a lead card's largest title, stepping down to `onPhone` on a phone. */
export const displayTitle = (onPhone: number = font.h2): StyleRule => ({
  fontSize: rem(font.display),
  lineHeight: leading.tight,
  letterSpacing: tracking.display,
  textWrap: "balance",
  "@media": {
    [media.phone]: { fontSize: rem(onPhone) }
  }
});
