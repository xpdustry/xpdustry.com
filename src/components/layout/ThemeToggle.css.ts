import { style } from "@vanilla-extract/css";

const darkQuery = "(prefers-color-scheme: dark)";

export const lightIcon = style({
  display: "block",
  "@media": {
    [darkQuery]: { display: "none" },
  },
  selectors: {
    '[data-theme="light"] &': { display: "block" },
    '[data-theme="dark"] &': { display: "none" },
  },
});

export const darkIcon = style({
  display: "none",
  "@media": {
    [darkQuery]: { display: "block" },
  },
  selectors: {
    '[data-theme="light"] &': { display: "none" },
    '[data-theme="dark"] &': { display: "block" },
  },
});
