import { createVar, globalStyle, style } from "@vanilla-extract/css";
import { paint } from "#app/textures/catalogue";
import { RIDGE } from "#app/textures/page";
import { media, upTo } from "#app/ui/styles/media";
import { font, leading, rem, tracking } from "#app/ui/styles/scale";
import { reachTouchTarget, touchTargetHeight } from "#app/ui/styles/touch";
import { onDeep } from "./onDeep";
import { logoWidth, nameSize } from "#app/brand/Brand.css";
import { vars } from "#app/ui/styles/theme.css";

const narrow = upTo(900);

export const ridgeHeight = createVar();

export const footer = style({
  ...onDeep,
  vars: { ...onDeep.vars, [ridgeHeight]: `${RIDGE.height}px` },
  position: "relative",
  marginTop: `calc(${ridgeHeight} + ${vars.group})`,
  background: vars.deep,
  "@media": {
    [media.phone]: { vars: { [ridgeHeight]: "120px" } }
  }
});

export const ridge = style({
  position: "absolute",
  inset: "auto 0 calc(100% - 1px)",
  height: ridgeHeight,
  background: `${paint("ridge")} 50% 100% / auto 100% repeat-x`,
  pointerEvents: "none"
});

export const inner = style({
  selectors: {
    [`${footer} &`]: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) auto",
      gridTemplateAreas: '"brand top" "copy links"',
      alignItems: "center",
      gap: "30px 32px",
      padding: `40px calc(${vars.gap} + 6px) 64px`
    }
  },
  "@media": {
    [narrow]: {
      selectors: {
        [`${footer} &`]: {
          gridTemplateAreas: '"brand top" "links links" "copy copy"',
          gap: "22px 16px"
        }
      }
    },
    [media.phone]: {
      selectors: {
        [`${footer} &`]: { paddingTop: 28, paddingBottom: 52 }
      }
    }
  }
});

export const brand = style({
  selectors: {
    [`${footer} &`]: {
      vars: { [logoWidth]: "52px", [nameSize]: `${rem(font.h1)}` },
      gridArea: "brand",
      justifySelf: "start",
      maxWidth: "100%",
      gap: 14,
      lineHeight: leading.tight
    }
  },
  "@media": {
    [media.coarse]: {
      selectors: { [`${footer} &`]: { position: "relative" } }
    },
    [media.phone]: {
      selectors: {
        [`${footer} &`]: { vars: { [logoWidth]: "44px", [nameSize]: `${rem(font.h2)}` } }
      }
    },
    [media.small]: {
      selectors: {
        [`${footer} &`]: { vars: { [logoWidth]: "34px", [nameSize]: `${rem(font.h3)}` }, gap: 10 }
      }
    }
  }
});

reachTouchTarget(`${footer} ${brand}`);

globalStyle(`${footer} ${brand} span`, {
  minWidth: 0,
  letterSpacing: tracking.display
});

export const links = style({
  gridArea: "links",
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: "8px 26px",
  "@media": {
    [narrow]: { justifyContent: "flex-start" }
  }
});

globalStyle(`${links} a`, {
  color: "inherit",
  overflowWrap: "anywhere",
  textDecoration: "underline 2px transparent",
  textUnderlineOffset: 5,
  transition: "text-decoration-color 0.13s",
  ...touchTargetHeight
});

globalStyle(`${links} a:hover`, {
  "@media": { [media.hover]: { textDecorationColor: vars.t9 } }
});

export const copyright = style({
  gridArea: "copy",
  color: vars.deepInk
});

export const top = style({
  selectors: {
    [`${footer} &`]: {
      gridArea: "top",
      justifySelf: "end",
      marginTop: 0
    }
  }
});

reachTouchTarget(`${footer} ${top}`);

globalStyle(`${footer} ${top} > span`, {
  "@media": {
    [media.phone]: { padding: 10 }
  }
});

export const say = style({
  "@media": {
    [media.phone]: { display: "none" }
  }
});
