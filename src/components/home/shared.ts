import { globalStyle } from "@vanilla-extract/css";
import { media } from "#app/styles/media";
import { pageGridWith } from "#app/styles/pageGrid";
import { font, leading } from "#app/styles/scale";
import { vars } from "#app/styles/theme.css";

export function cards(rowHeight: number) {
  const cards = pageGridWith({
    gridAutoRows: rowHeight,
    "@media": {
      [media.phone]: { display: "flex", flexDirection: "column" },
    },
  });
  globalStyle(`:where(${cards}) > *`, {
    "@media": {
      [media.phone]: { minHeight: 180 },
    },
  });
  return cards;
}

export const figures = (lineHeight: number = leading.tight) =>
  `500 ${font.caption}px / ${lineHeight} ${vars.fontMono}`;
