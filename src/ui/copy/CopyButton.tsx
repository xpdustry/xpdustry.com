import { useGT } from "gt-tanstack-start";
import type { ReactNode, RefCallback } from "react";
import { PlinthButton, type PlinthStyle } from "../Plinth";
import { CopyStatus } from "./CopyStatus";
import { useCopy, type CopyState } from "./useCopy";
import * as styles from "./CopyButton.css";

type CopyButtonProps = {
  text: string;
  tone?: PlinthStyle["tone"];
  className?: string;
} & (
  | { children: ReactNode; label?: never }
  | {
      children: (state: CopyState, address: RefCallback<HTMLElement>) => ReactNode;
      label: string;
    }
);

export function CopyButton({ text, label, children, tone = "ink", className }: CopyButtonProps) {
  const gt = useGT();
  const { state, outcome, address, copy } = useCopy(text);
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
        {drawn ? children(state, address) : <Said state={state}>{children}</Said>}
      </PlinthButton>
      {!drawn && state === "failed" && <Refused text={text} address={address} />}
      <CopyStatus outcome={outcome} text={text} />
    </>
  );
}

function Said({ state, children }: { state: CopyState; children: ReactNode }) {
  const gt = useGT();
  if (state === "copied") return gt("Copied");
  if (state === "failed") return gt("Could not copy");
  return children;
}

function Refused({ text, address }: { text: string; address: RefCallback<HTMLElement> }) {
  return (
    <span ref={address} className={styles.refused}>
      {text}
    </span>
  );
}
