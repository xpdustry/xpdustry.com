import { style } from "@vanilla-extract/css";
import { layoutRules } from "#app/styles/layout.css";
import { colors, weight } from "#app/styles/theme.css";

export const shell = style({
  position: "relative",
  isolation: "isolate",
  display: "flex",
  minHeight: "100vh",
  flexDirection: "column",
});

export const skipLink = style({
  position: "absolute",
  top: "-6.25rem",
  left: "1rem",
  zIndex: 600,
  borderWidth: "2px",
  borderStyle: "solid",
  borderColor: colors.line,
  borderRadius: "0.5rem",
  backgroundColor: colors.panel,
  padding: "0.75rem 1rem",
  color: colors.ink,
  fontWeight: weight.bold,
  textDecoration: "none",
  ":focus": { top: "1rem" },
});

export const main = style({ flex: 1 });
export const loading = style([layoutRules.wrap, { paddingBlock: "6rem" }]);
