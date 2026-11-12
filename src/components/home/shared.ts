import { globalStyle, style } from "@vanilla-extract/css";
import { media } from "#app/styles/media";
import { font, leading } from "#app/styles/scale";
import { grid } from "#app/styles/layout.css";
import { vars } from "#app/styles/theme.css";

/**
 * A tray of cards on the page grid, in rows `rowHeight` tall. On a phone the cards stack, each as
 * tall as its content and never under 180px; a card's own `minHeight` there wins over that.
 */
export function cards(rowHeight: number) {
  const cards = style([
    grid,
    {
      gridAutoRows: rowHeight,
      "@media": {
        [media.phone]: { display: "flex", flexDirection: "column" },
      },
    },
  ]);
  globalStyle(`:where(${cards}) > *`, {
    "@media": {
      [media.phone]: { minHeight: 180 },
    },
  });
  return cards;
}

/** Counts and versions: small print, in the mono face. */
export const figures = (lineHeight: number = leading.tight) =>
  `500 ${font.caption}px / ${lineHeight} ${vars.fontMono}`;
