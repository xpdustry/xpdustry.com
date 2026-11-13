import { globalStyle, style } from "@vanilla-extract/css";
import { media } from "../styles/media";
import { font, leading, rem } from "../styles/scale";
import { vars } from "../styles/theme.css";

/**
 * A copy card's line, such as its player count, which a word like "Copied" (`said`) takes the
 * place of after a press (`rolled`): the line rolls up and out as the word rolls up and in, in
 * one cell that clips them.
 */
export const line = style({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  overflow: "hidden",
  // Room for the letters' ascenders and tails, which grow with the text.
  margin: "-0.25em 0",
  padding: "0.25em 0"
});

export const rolled = style({});

export const said = style({
  overflow: "hidden",
  fontSize: rem(font.caption),
  lineHeight: leading.tight,
  whiteSpace: "normal",
  overflowWrap: "anywhere",
  translate: "0 110%",
  opacity: 0,
  "@media": {
    [media.still]: { translate: "none" }
  }
});

globalStyle(`${line} > *`, {
  gridArea: "1 / 1",
  transition: `translate 0.32s ${vars.easeOut}, opacity 0.2s`
});

globalStyle(`${rolled} > :not(${said})`, {
  translate: "0 -110%",
  opacity: 0,
  "@media": {
    [media.still]: { translate: "none" }
  }
});

globalStyle(`${rolled} > ${said}`, {
  translate: "0",
  opacity: 1
});
