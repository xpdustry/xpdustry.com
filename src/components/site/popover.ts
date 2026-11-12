import type { StyleRule } from "@vanilla-extract/css";
import { vars } from "#app/styles/theme.css";

const DURATION = "0.18s";

/** A panel that drops from under its button: out of sight, focus and the accessibility tree. */
export const popoverShut: StyleRule = {
  visibility: "hidden",
  opacity: 0,
  translate: "0 -8px",
  scale: "0.97",
  transformOrigin: "top right",
};

/** For visitors who accept motion. Visibility waits for the fade when shutting. */
export const popoverTransition = `opacity ${DURATION} ${vars.easeOut}, translate ${DURATION} ${vars.easeOut}, scale ${DURATION} ${vars.easeOut}, visibility 0s ${DURATION}`;

export const popoverOpen: StyleRule = {
  visibility: "visible",
  opacity: 1,
  translate: "0",
  scale: "1",
  transitionDelay: "0s",
};
