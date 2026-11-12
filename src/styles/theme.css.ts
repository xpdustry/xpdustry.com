import { createGlobalTheme, createGlobalThemeContract, globalStyle } from "@vanilla-extract/css";
import { media } from "./media";

/**
 * The site's design tokens, as custom properties on `:root`. Their names are kept readable
 * (`--outline`, `--gap`), since components also set and read them from inline styles.
 */
export const vars = createGlobalThemeContract(
  {
    // neutrals, teal and amber ramps
    n1: "n1",
    n2: "n2",
    n3: "n3",
    n6: "n6",
    n10: "n10",
    n11: "n11",
    n12: "n12",
    t3: "t3",
    t9: "t9",
    t12: "t12",
    a3: "a3",
    a9: "a9",
    a11: "a11",

    // roles
    page: "page",
    tile: "tile",
    ink: "ink",
    muted: "muted",
    outline: "outline",
    wall: "wall",
    amberWall: "amber-wall",
    deep: "deep",
    deepInk: "deep-ink",
    tray: "tray",
    online: "online",
    /** As `r g b`, for `rgb(var(--glow) / alpha)`. */
    glow: "glow",
    focus: "focus",
    /** Text on the teal and amber faces of a plinth or a callout. */
    onTeal: "on-teal",
    onAmber: "on-amber",
    /** Text on the page itself and on the deep teal of the header and footer. */
    onDeep: "on-deep",
    /** The edge of a control that sits on the deep teal. */
    deepWall: "deep-wall",
    /** Behind a screenshot or a video, while it loads and where it does not reach. */
    stage: "stage",

    // shape
    r: "r",
    gap: "gap",
    /** The space between the page's groups: header, cover, each tray and the footer. */
    group: "group",

    fontDisplay: "font-display",
    fontText: "font-text",
    fontMono: "font-mono",
    easeOut: "ease-out",
    easeSpring: "ease-spring",
    /** A patch of labyrinth growing under the pointer: steady, then settling. */
    easeGrow: "ease-grow",
  },
  (name) => name ?? "",
);

createGlobalTheme(":root", vars, {
  n1: "#f7fdfd",
  n2: "#eef8f7",
  n3: "#e4f1f0",
  n6: "#c2d5d3",
  n10: "#587270",
  n11: "#395654",
  n12: "#0e2625",
  t3: "#c6f6f2",
  t9: "#41c1ba",
  t12: "#003331",
  a3: "#fde6c1",
  a9: "#ffd37f",
  a11: "#795700",

  page: "#135854",
  tile: vars.n1,
  ink: vars.n12,
  muted: vars.n11,
  outline: "#0f3b38",
  wall: "#1f8f88",
  amberWall: "#a67618",
  deep: "#083230",
  deepInk: "#a2c2bf",
  tray: "#b8dfda",
  online: "#3ba55d",
  glow: "65 193 186",
  focus: "#007f79",
  onTeal: "#08201e",
  onAmber: "#2b1a00",
  onDeep: "#eaf7f5",
  deepWall: "#4f8e89",
  stage: "#0e1514",

  r: "26px",
  gap: "14px",
  group: "56px",

  fontDisplay: '"Momo Trust Display", system-ui, sans-serif',
  fontText: '"Momo Trust Sans Variable", system-ui, sans-serif',
  fontMono: '"DM Mono", ui-monospace, monospace',
  easeOut: "cubic-bezier(0.22, 1, 0.36, 1)",
  easeSpring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  easeGrow: "cubic-bezier(0.3, 0.5, 0.4, 1)",
});

globalStyle(":root", {
  "@media": {
    [media.phone]: { vars: { [vars.group]: "40px" } },
  },
});
