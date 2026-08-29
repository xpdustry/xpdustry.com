import { style } from "@vanilla-extract/css";
import logoMonochrome from "#app/assets/logo-monochrome.svg";
import { layoutStyles } from "#app/styles/layout.css";
import {
  colors,
  leading,
  media,
  motion,
  radii,
  space,
  tracking,
  type,
  weight,
} from "#app/styles/theme.css";

export const header = style({
  position: "sticky",
  top: 0,
  zIndex: 50,
  borderBottom: "2px solid transparent",
  backgroundColor: "transparent",
  transition: `background-color ${motion.base} ${motion.ease}, border-color ${motion.base} ${motion.ease}`,
  selectors: {
    '&[data-scrolled="true"]': {
      borderBottomColor: colors.line,
      backgroundColor: `color-mix(in srgb, ${colors.page} 82%, transparent)`,
      backdropFilter: "blur(12px) saturate(1.4)",
    },
  },
});

export const headerLayout = style([
  layoutStyles.wrap,
  {
    display: "flex",
    minHeight: "4.75rem",
    alignItems: "center",
    gap: space.four,
    paddingBlock: space.three,
  },
]);

export const brand = style({
  display: "inline-flex",
  alignItems: "center",
  gap: space.three,
  color: colors.ink,
  textDecoration: "none",
});

export const headerLogo = style({
  display: "block",
  width: "2.375rem",
  height: "2.375rem",
  flex: "none",
  backgroundColor: colors.ink,
  maskImage: `url("${logoMonochrome}")`,
  maskPosition: "center",
  maskRepeat: "no-repeat",
  maskSize: "contain",
});

export const brandName = style({
  fontSize: type.twoXl,
  fontWeight: weight.extraBold,
  fontStretch: "110%",
  letterSpacing: tracking.tight,
  lineHeight: leading.none,
});

export const desktopNav = style({
  display: "none",
  gap: space.one,
  marginLeft: space.four,
  "@media": { [media.lg]: { display: "flex" } },
});

export const navLink = style({
  display: "inline-flex",
  height: "2.125rem",
  alignItems: "center",
  borderRadius: radii.md,
  paddingInline: space.three,
  color: colors.inkMuted,
  fontSize: type.sm,
  fontWeight: weight.semibold,
  lineHeight: leading.sm,
  textDecoration: "none",
  transition: `background-color ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease}`,
  selectors: {
    "&:hover": { backgroundColor: colors.panel, color: colors.ink },
    '&[aria-current="page"]': { backgroundColor: colors.panel, color: colors.ink },
  },
});

export const controls = style({
  display: "flex",
  alignItems: "center",
  gap: space.two,
  marginLeft: "auto",
});

export const desktopControl = style({
  display: "none",
  "@media": { [media.lg]: { display: "inline-flex" } },
});

export const mobileControl = style({
  display: "inline-flex",
  "@media": { [media.lg]: { display: "none" } },
});

export const drawer = style({
  display: "block",
  borderTop: `2px solid ${colors.lineSoft}`,
  backgroundColor: colors.page,
  "@media": { [media.lg]: { display: "none" } },
});

export const drawerNav = style([
  layoutStyles.wrap,
  {
    display: "grid",
    gap: space.three,
    paddingBlock: space.six,
  },
]);
