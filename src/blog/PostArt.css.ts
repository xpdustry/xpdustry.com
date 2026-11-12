import { createVar, fallbackVar, style } from "@vanilla-extract/css";
import { logoShadow } from "./topicTheme.css";

export const artTop = createVar();
export const artLogo = createVar();

export const art = style({
  isolation: "isolate",
  overflow: "hidden"
});

export const logo = style({
  position: "absolute",
  top: fallbackVar(artTop, "24px"),
  left: "50%",
  width: fallbackVar(artLogo, "96px"),
  translate: "-50% 0",
  filter: `drop-shadow(0 6px 0 ${logoShadow})`
});
