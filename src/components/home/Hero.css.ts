import { createVar, fallbackVar, globalStyle, style } from "@vanilla-extract/css";
import { media } from "#app/styles/media";
import { font, leading, rem, tracking } from "#app/styles/scale";
import { vars } from "#app/styles/theme.css";

const size = createVar();
const sizeMax = createVar();

export const hero = style({
  containerType: "inline-size",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  padding: 34,
  background: vars.t3,
});

const NAME_WIDTH_EM = 4.45;
const MARK_WIDTH_EM = 1.083;
const MARK_GAP_ALLOWANCE_PX = 26;

export const brand = style({
  vars: {
    [size]: `min(${fallbackVar(sizeMax, rem(96))}, calc((100cqi - ${MARK_GAP_ALLOWANCE_PX}px) / ${(NAME_WIDTH_EM + MARK_WIDTH_EM).toFixed(2)}))`,
  },
  display: "flex",
  alignItems: "center",
  gap: 18,
  "@media": {
    [media.tablet]: { vars: { [sizeMax]: rem(72) } },
    [media.phone]: { vars: { [sizeMax]: rem(52) }, gap: 12 },
  },
});

export const mark = style({
  selectors: {
    [`${hero} &`]: { width: `calc(${size} * ${MARK_WIDTH_EM})` },
  },
});

globalStyle(`${brand} h1`, {
  minWidth: 0,
  fontSize: size,
  lineHeight: leading.tight,
  letterSpacing: tracking.display,
  color: vars.t12,
  textWrap: "balance",
});

globalStyle(`${hero} p`, {
  maxWidth: "38ch",
  marginTop: 22,
  fontSize: rem(font.lead),
  lineHeight: leading.text,
  color: vars.t12,
  opacity: 0.85,
});

export const actions = style({
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 26,
});
