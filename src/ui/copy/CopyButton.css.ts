import { style } from "@vanilla-extract/css";
import { font, radius, rem } from "../styles/scale";
import { vars } from "../styles/theme.css";

export const refused = style({
  flexBasis: "100%",
  padding: "6px 9px",
  borderRadius: radius.sm,
  background: vars.n3,
  font: `500 ${rem(font.caption)} ${vars.fontMono}`,
  overflowWrap: "anywhere",
  userSelect: "all",
  cursor: "text"
});
