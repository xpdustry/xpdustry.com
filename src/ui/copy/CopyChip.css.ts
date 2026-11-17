import { globalStyle, keyframes, style } from "@vanilla-extract/css";
import { media } from "../styles/media";
import { chip } from "../Card.css";
import { vars } from "../styles/theme.css";

const shake = keyframes({
  "0%, 100%": { translate: "0" },
  "20%, 60%": { translate: "-3px" },
  "40%, 80%": { translate: "3px" }
});

export const failed = style({
  selectors: {
    [`${chip}&`]: {
      background: vars.alarm,
      color: vars.onAlarm,
      "@media": { [media.motion]: { animation: `${shake} 0.4s ${vars.easeOut}` } }
    }
  }
});

export const stacked = style({});
export const ticked = style({});

globalStyle(`${stacked} svg`, {
  gridArea: "1 / 1",
  transition: `scale 0.28s ${vars.easeOut}, rotate 0.28s ${vars.easeOut}, opacity 0.16s`
});

export const glyph = style({
  selectors: {
    [`${ticked} &`]: { scale: "0.4", opacity: 0 }
  },
  "@media": {
    [media.still]: {
      selectors: {
        [`${ticked} &`]: { scale: "1", rotate: "none" }
      }
    }
  }
});

export const tick = style({
  scale: "0.4",
  rotate: "-30deg",
  opacity: 0,
  selectors: {
    [`${ticked} &`]: {
      scale: "1",
      rotate: "0deg",
      opacity: 1,
      transitionTimingFunction: vars.easeSpring
    }
  },
  "@media": {
    [media.still]: { scale: "1", rotate: "none" }
  }
});
