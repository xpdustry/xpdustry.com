import { createGlobalTheme, createGlobalThemeContract, globalStyle } from "@vanilla-extract/css";
import { FACE } from "./fonts";
import { media } from "./media";
import { PALETTE } from "./palette";

export const GAP = 14;

export const vars = createGlobalThemeContract(
  {
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
    focus: "focus",
    onTeal: "on-teal",
    onAmber: "on-amber",
    alarm: "alarm",
    alarmWall: "alarm-wall",
    onAlarm: "on-alarm",
    onGround: "on-ground",
    onDeep: "on-deep",
    deepWall: "deep-wall",
    stage: "stage",

    r: "r",
    gap: "gap",
    group: "group",

    fontDisplay: "font-display",
    fontText: "font-text",
    fontMono: "font-mono",
    easeOut: "ease-out",
    easeSpring: "ease-spring",
    easeGrow: "ease-grow"
  },
  (name) => name ?? ""
);

createGlobalTheme(":root", vars, {
  ...PALETTE,
  tile: vars.n1,
  ink: vars.n12,
  muted: vars.n11,

  r: "26px",
  gap: `${GAP}px`,
  group: "56px",

  fontDisplay: `"${FACE.display}", "${FACE.cyrillicDisplay}", system-ui, sans-serif`,
  fontText: `"${FACE.text}", "${FACE.cyrillicText}", system-ui, sans-serif`,
  fontMono: `"${FACE.mono}", "${FACE.cyrillicMono}", ui-monospace, monospace`,
  easeOut: "cubic-bezier(0.22, 1, 0.36, 1)",
  easeSpring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  easeGrow: "cubic-bezier(0.3, 0.5, 0.4, 1)"
});

globalStyle(":root", {
  "@media": {
    [media.phone]: { vars: { [vars.group]: "40px" } }
  }
});
