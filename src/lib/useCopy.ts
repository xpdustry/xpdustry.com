import { useEffect, useRef, useState } from "react";

/** Nothing to report, the text is on the clipboard, or the browser refused to put it there. */
export type CopyState = "idle" | "copied" | "failed";

const COPIED_MS = 1800;

/**
 * Puts `text` on the clipboard and resolves to whether it got there. A browser without the
 * clipboard API, as on a page served over plain http, cannot copy: the address is shown instead.
 */
export async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copies `text` on `copy()` and reports how it went: `copied` for a moment once the clipboard
 * took it, or `failed` until the next attempt, so the address shown in its place stays put while
 * the visitor selects it.
 */
export function useCopy(text: string) {
  const [state, setState] = useState<CopyState>("idle");
  const attempt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(
    () => () => {
      attempt.current++;
      clearTimeout(timer.current);
    },
    [],
  );

  const copy = async () => {
    const id = ++attempt.current;
    clearTimeout(timer.current);
    const copied = await writeClipboard(text);
    // A newer press, or the component going away, has the last word.
    if (id !== attempt.current) return;
    setState(copied ? "copied" : "failed");
    if (copied) timer.current = setTimeout(() => setState("idle"), COPIED_MS);
  };
  return { state, copy };
}
