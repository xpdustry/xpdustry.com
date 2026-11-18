import { createVar, globalStyle, style } from "@vanilla-extract/css";
import { vars } from "#app/ui/styles/theme.css";
import { IN_VIEW, TRANSITION, traveller } from "#app/ui/viewTransition.css";

const MORPH_MS = 420;

function part(kind: string) {
  const name = createVar();
  const className = style([traveller]);
  globalStyle(`:root:active-view-transition-type(${TRANSITION.post}) ${className}[${IN_VIEW}]`, {
    viewTransitionName: name,
    viewTransitionClass: `post post-${kind}`
  });
  return { name, className };
}

export const card = part("card");
export const title = part("title");
export const topic = part("topic");
export const description = part("description");
export const art = part("art");

const snapshots = (kind: string) =>
  `::view-transition-old(*.post-${kind}), ::view-transition-new(*.post-${kind})`;

globalStyle("::view-transition-group(*.post)", {
  animationDuration: `${MORPH_MS}ms`
});

globalStyle("::view-transition-group(*.post-card)", {
  overflow: "clip",
  borderRadius: vars.r
});

globalStyle(snapshots("card"), {
  height: "100%"
});

globalStyle(`${snapshots("title")}, ${snapshots("topic")}, ${snapshots("description")}`, {
  height: "100%",
  objectFit: "contain",
  objectPosition: "left top"
});
