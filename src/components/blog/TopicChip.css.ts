import { createVar, globalStyle, styleVariants } from "@vanilla-extract/css";
import { font, radius, rem } from "#app/styles/scale";
import { accented, pill } from "./themed.css";

export const face = createVar();
export const ink = createVar();

export const tone = styleVariants({
  card: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 9px 4px 5px",
    borderRadius: radius.sm,
    background: face,
    color: ink,
    fontSize: rem(font.caption)
  },
  cover: [pill, accented]
});

globalStyle(`${tone.card} img`, {
  width: 16
});

globalStyle(`${tone.cover} img`, {
  width: 20
});
