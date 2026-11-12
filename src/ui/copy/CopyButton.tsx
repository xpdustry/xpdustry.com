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
  return (
    <>
      <PlinthButton
        tone={tone}
        size="sm"
        copy={state}
        className={className}
        onClick={copy}
        {...(drawn && { "aria-label": label, title: gt("Copy address") })}
      >
        {drawn ? children(state) : <Said state={state}>{children}</Said>}
      </PlinthButton>
      <CopyStatus state={state} text={text} />
    </>
  );
}

/** The button's text, or what became of the copy once it was pressed. */
function Said({ state, children }: { state: CopyState; children: ReactNode }) {
  const gt = useGT();
  if (state === "copied") return gt("Copied");
  if (state === "failed") return gt("Could not copy");
  return children;
}
