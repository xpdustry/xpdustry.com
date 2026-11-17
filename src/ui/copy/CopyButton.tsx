import { useGT } from "gt-tanstack-start";
import type { ReactNode } from "react";
import { PlinthButton, type PlinthStyle } from "../Plinth";
import { CopyStatus } from "./CopyStatus";
import { useCopy, type CopyState } from "./useCopy";

type CopyButtonProps = {
  text: string;
  tone?: PlinthStyle["tone"];
  className?: string;
} & (
  | { children: ReactNode; label?: never }
  | { children: (state: CopyState) => ReactNode; label: string }
);

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

function Said({ state, children }: { state: CopyState; children: ReactNode }) {
  const gt = useGT();
  if (state === "copied") return gt("Copied");
  if (state === "failed") return gt("Could not copy");
  return children;
}
