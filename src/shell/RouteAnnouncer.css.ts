import { globalStyle, style } from "@vanilla-extract/css";

export const focusedByNavigation = style({});

globalStyle(`${focusedByNavigation}:focus`, {
  outline: "none"
});
