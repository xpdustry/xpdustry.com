import { useGT } from "gt-tanstack-start";
import type { ReactNode } from "react";
import { PlinthButton, type PlinthStyle } from "../Plinth";
import { CopyStatus } from "./CopyStatus";
import { useCopy, type CopyState } from "./useCopy";

interface CopyButtonProps {
  text: string;
  /**
   * The button's text, which says "Copied" or "Could not copy" after a press. Or a function
   * drawing the button's face for each state; `label` names it then.
   */
  children: ReactNode | ((state: CopyState) => ReactNode);
  /** The accessible name of a drawn face, as in "Copy hub.md.xpdustry.com". */
  label?: string;
  tone?: PlinthStyle["tone"];
  className?: string;
}

/** Copies `text`, turns teal when it landed or red when the browser refused, and says so. */
export function CopyButton({ text, label, children, tone = "ink", className }: CopyButtonProps) {
  const gt = useGT();
  const { state, copy } = useCopy(text);
  const drawn = typeof children === "function";
  const face = drawn
    ? children(state)
    : state === "copied"
      ? gt("Copied")
      : state === "failed"
        ? gt("Could not copy")
        : children;
  return (
    <>
      <PlinthButton
        tone={tone}
        size="sm"
        done={state === "copied"}
        failed={state === "failed"}
        className={className}
        onClick={copy}
        {...(drawn && { "aria-label": label, title: gt("Copy address") })}
      >
        {face}
      </PlinthButton>
      <CopyStatus state={state} text={text} />
    </>
  );
}
