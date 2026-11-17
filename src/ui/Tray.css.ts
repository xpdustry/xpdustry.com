import { createVar, globalStyle, style, type GlobalStyleRule } from "@vanilla-extract/css";
import { media, narrowerThan, upTo } from "./styles/media";
import { font, leading, OUTLINE, radius, rem, tracking } from "./styles/scale";
import { GAP, vars } from "./styles/theme.css";

const tabWidth = createVar();
const trayR = createVar();
const bodyTopRightR = createVar();

const trayWidth = createVar();

const CRAMPED_CONTENT = 273;
const cramped = narrowerThan(CRAMPED_CONTENT + 2 * GAP);

const narrow = upTo(700);
const tiny = upTo(360);

const SLANT = { run: 35, rise: 70, bend: 14 } as const;
const SLANT_WIDTH = SLANT.run + 2 * SLANT.bend;
const SLANT_PAST_TAB = SLANT_WIDTH / 2;
const TAB_TUCK = OUTLINE;

const px = (value: number) => `${Math.round(value * 1000) / 1000}px`;

function slantedTab(edge: "outer" | "inner"): string {
  const inward = edge === "outer" ? -1 : 1;
  const half = OUTLINE / 2;
  const length = Math.hypot(SLANT.run, SLANT.rise);
  const tabBottom = `(100% - ${TAB_TUCK}px)`;
  const edgeInset = px(half + inward * half);
  const bottom = `calc(${tabBottom} - ${px(half - inward * half)})`;
  const lowest = edge === "outer" ? `calc(${tabBottom})` : "100%";
  const bendShift = (half * (length - SLANT.run)) / SLANT.rise;
  const topBend = SLANT.bend - inward * bendShift;
  const bottomBend = SLANT.bend + inward * bendShift;
  const topCorner = `calc(100% - ${px(SLANT_WIDTH - topBend)})`;
  const bottomCorner = `calc(100% - ${px(bottomBend)})`;
  const across = (along: number) => px((along * SLANT.run) / length);
  const down = (along: number) => `${along / length} * (${tabBottom} - ${OUTLINE}px)`;
  return [
    `shape(from ${edgeInset} ${lowest}`,
    `vline to ${vars.r}`,
    `arc to ${vars.r} ${edgeInset} of calc(${vars.r} - ${edgeInset}) cw`,
    `hline to calc(100% - ${SLANT_WIDTH}px)`,
    `curve to calc(${topCorner} + ${across(topBend)}) calc(${edgeInset} + ${down(topBend)}) with ${topCorner} ${edgeInset}`,
    `line to calc(${bottomCorner} - ${across(bottomBend)}) calc(${bottom} - ${down(bottomBend)})`,
    `curve to 100% ${bottom} with ${bottomCorner} ${bottom}`,
    `vline to ${lowest}`,
    "close)"
  ].join(", ");
}

const innerR = (r: string) => `max(0px, ${r} - ${OUTLINE}px)`;

interface Sides {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

type Corners = [topLeft: string, topRight: string, bottomRight: string, bottomLeft: string];

function roundedBox({ top, right, bottom, left }: Sides, [tl, tr, br, bl]: Corners): string {
  const fromRight = (by: string) => `calc(100% - ${right} - ${by})`;
  const fromBottom = (by: string) => `calc(100% - ${bottom} - ${by})`;
  return [
    `shape(from ${left} calc(${top} + ${tl})`,
    `arc to calc(${left} + ${tl}) ${top} of ${tl} cw`,
    `hline to ${fromRight(tr)}`,
    `arc to calc(100% - ${right}) calc(${top} + ${tr}) of ${tr} cw`,
    `vline to ${fromBottom(br)}`,
    `arc to ${fromRight(br)} calc(100% - ${bottom}) of ${br} cw`,
    `hline to calc(${left} + ${bl})`,
    `arc to ${left} ${fromBottom(bl)} of ${bl} cw`,
    "close)"
  ].join(", ");
}

const flush = "0px";
const ring = `${OUTLINE}px`;

export const tray = style({
  vars: {
    [tabWidth]: rem(484),
    [trayR]: `calc(${vars.r} + ${vars.gap})`,
    [trayWidth]: "100cqw"
  },
  position: "relative",
  isolation: "isolate",
  containerType: "inline-size",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  marginTop: `calc(1px + ${vars.group})`,
  "@media": {
    [narrow]: { vars: { [tabWidth]: rem(331) } },
    [media.phone]: { vars: { [tabWidth]: rem(293) } },
    [media.small]: { vars: { [tabWidth]: rem(245) } },
    [tiny]: { vars: { [tabWidth]: rem(232) } }
  }
});

const SHAPES = "(clip-path: shape(from 0 0, line to 1px 1px))";
const UNFORCED_COLOURS = "(forced-colors: none)";

const whereShaped = (rule: GlobalStyleRule): GlobalStyleRule => ({
  "@supports": { [SHAPES]: { "@media": { [UNFORCED_COLOURS]: rule } } }
});

const bordered = `${OUTLINE}px solid ${vars.outline}`;

export const body = style({
  vars: {
    [bodyTopRightR]: `clamp(0px, ${trayWidth} - ${tabWidth} - ${SLANT_PAST_TAB}px, ${trayR})`
  },
  gridArea: "2 / 1",
  position: "relative",
  zIndex: -1,
  border: bordered,
  borderRadius: `0 ${bodyTopRightR} ${trayR} ${trayR}`,
  background: vars.tray,
  "@container": {
    [cramped]: { vars: { [bodyTopRightR]: "0px" } }
  }
});

globalStyle(
  body,
  whereShaped({
    border: 0,
    borderRadius: 0,
    background: vars.outline,
    clipPath: roundedBox({ top: flush, right: flush, bottom: flush, left: flush }, [
      flush,
      bodyTopRightR,
      trayR,
      trayR
    ])
  })
);

globalStyle(
  `${body}::before`,
  whereShaped({
    content: '""',
    position: "absolute",
    inset: 0,
    background: vars.tray,
    clipPath: roundedBox({ top: ring, right: ring, bottom: ring, left: ring }, [
      flush,
      innerR(bodyTopRightR),
      innerR(trayR),
      innerR(trayR)
    ])
  })
);

export const tab = style({
  gridArea: "1 / 1",
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: 14,
  width: tabWidth,
  maxWidth: "100%",
  minHeight: 72,
  marginBottom: -OUTLINE,
  padding: "11px 44px 3px 14px",
  borderRadius: `${vars.r} ${vars.r} 0 0`,
  "::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    zIndex: -1,
    border: bordered,
    borderBottomWidth: 0,
    borderRadius: "inherit",
    background: vars.tray,
    pointerEvents: "none"
  },
  "@container": {
    [cramped]: { width: "100%", paddingRight: 14 }
  },
  "@media": {
    [media.phone]: { gap: 10, paddingLeft: 10 },
    [media.small]: { paddingLeft: 16 }
  }
});

const shapedTabLayer = (fill: string, slanted: string, unslanted: string): GlobalStyleRule =>
  whereShaped({
    content: '""',
    position: "absolute",
    inset: `0 -${SLANT_PAST_TAB}px -${TAB_TUCK}px 0`,
    zIndex: -1,
    border: 0,
    borderRadius: 0,
    background: fill,
    clipPath: slanted,
    pointerEvents: "none",
    "@container": {
      [cramped]: { right: 0, clipPath: unslanted }
    }
  });

globalStyle(
  `${tab}::before`,
  shapedTabLayer(
    vars.outline,
    slantedTab("outer"),
    roundedBox({ top: flush, right: flush, bottom: `${TAB_TUCK}px`, left: flush }, [
      vars.r,
      vars.r,
      flush,
      flush
    ])
  )
);

globalStyle(
  `${tab}::after`,
  shapedTabLayer(
    vars.tray,
    slantedTab("inner"),
    roundedBox({ top: ring, right: ring, bottom: flush, left: ring }, [
      innerR(vars.r),
      innerR(vars.r),
      flush,
      flush
    ])
  )
);

export const icon = style({
  flex: "none",
  display: "grid",
  placeItems: "center",
  width: 46,
  height: 46,
  border: `2px solid ${vars.outline}`,
  borderRadius: radius.md,
  background: vars.tile,
  "@media": {
    [media.phone]: { width: 40, height: 40 },
    [media.small]: { display: "none" }
  }
});

globalStyle(`${icon} svg`, {
  width: 26,
  height: 26,
  "@media": {
    [media.phone]: { width: 22, height: 22 }
  }
});

export const titles = style({
  display: "grid",
  gap: 4,
  minWidth: 0
});

globalStyle(`${titles} h2`, {
  fontSize: rem(font.h3),
  lineHeight: leading.tight,
  letterSpacing: tracking.heading,
  "@media": {
    [media.phone]: { fontSize: rem(font.h4) }
  }
});

export const subtitle = style({
  fontSize: rem(font.caption),
  color: vars.muted,
  "@media": {
    [narrow]: { display: "none" }
  }
});

export const content = style({
  gridArea: "2 / 1",
  containerType: "inline-size",
  padding: vars.gap
});

export const action = style({
  selectors: {
    [`${tab} > &`]: {
      position: "static",
      flex: "none",
      marginLeft: "auto"
    },
    [`${tab} > &::after`]: {
      content: '""',
      position: "absolute",
      inset: `0 0 -${OUTLINE}px`,
      borderRadius: `${vars.r} ${vars.r} 0 0`
    },
    [`${tab} > &:focus-visible`]: {
      outline: "none"
    }
  }
});

globalStyle(`${tab}:has(> ${action}) ${titles}`, {
  marginRight: 4
});

globalStyle(`${tab} > ${action} > span`, {
  padding: 7
});

globalStyle(`${tab}:has(> ${action}:focus-visible)`, {
  outline: `3px solid ${vars.t9}`,
  outlineOffset: 2
});

globalStyle(`${tab}:has(> ${action})`, {
  "@media": {
    [media.phone]: { gap: 14 }
  }
});
