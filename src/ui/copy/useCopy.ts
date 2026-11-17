import { useEffect, useRef, useState } from "react";

export type CopyState = "idle" | "copied" | "failed";

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
  const latestAttempt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(
    () => () => {
      latestAttempt.current++;
      clearTimeout(timer.current);
    },
    []
  );

  const copy = async () => {
    const attempt = ++latestAttempt.current;
    clearTimeout(timer.current);
    const copied = await writeClipboard(text);
    if (attempt !== latestAttempt.current) return;
    setState(copied ? "copied" : "failed");
    if (copied) timer.current = setTimeout(() => setState("idle"), COPIED_MS);
  };
  return { state, copy };
}
