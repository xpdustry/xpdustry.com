import { globalStyle } from "@vanilla-extract/css";
import { media } from "#app/ui/styles/media";
import { pageGridWith } from "#app/ui/styles/pageGrid";
import { font, leading, rem } from "#app/ui/styles/scale";
import { vars } from "#app/ui/styles/theme.css";

export function cards(rowHeight: number) {
  const cards = pageGridWith({
    gridAutoRows: `minmax(${rowHeight}px, auto)`,
    "@media": {
      [media.phone]: { display: "flex", flexDirection: "column" }
    }
  });
  globalStyle(`:where(${cards}) > *`, {
    "@media": {
      [media.phone]: { minHeight: 180 }
    }
  });
  return cards;
}

export const figures = (lineHeight: number = leading.tight) =>
  `500 ${rem(font.caption)} / ${lineHeight} ${vars.fontMono}`;
