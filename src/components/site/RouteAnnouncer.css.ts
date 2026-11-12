import { globalStyle, style } from "@vanilla-extract/css";

/** Marks where a navigation put the focus, which a reader did not choose and needs no ring for. */
export const landing = style({});

globalStyle(`${landing}:focus`, {
  outline: "none",
});
