import { useCallback, useEffect, useRef, useState } from "react";

export type CopyState = "idle" | "copied" | "failed";
export type CopyOutcome = Exclude<CopyState, "idle">;

const COPIED_MS = 1400;

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function useCopy(text: string) {
  const [state, setState] = useState<CopyState>("idle");
  const [outcome, setOutcome] = useState<CopyOutcome>();
  const [refusals, setRefusals] = useState(0);
  const shown = useRef<HTMLElement>(null);
  const address = useCallback((element: HTMLElement | null) => {
    shown.current = element;
  }, []);
  const latestAttempt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(
    () => () => {
      latestAttempt.current++;
      clearTimeout(timer.current);
    },
    []
  );
  useEffect(() => {
    if (refusals > 0 && shown.current) getSelection()?.selectAllChildren(shown.current);
  }, [refusals]);

  const copy = async () => {
    const attempt = ++latestAttempt.current;
    clearTimeout(timer.current);
    setOutcome(undefined);
    const copied = await writeClipboard(text);
    if (attempt !== latestAttempt.current) return;
    setState(copied ? "copied" : "failed");
    setOutcome(copied ? "copied" : "failed");
    if (copied) timer.current = setTimeout(() => setState("idle"), COPIED_MS);
    else setRefusals((count) => count + 1);
  };
  return { state, outcome, address, copy };
}
