import { useEffect, useRef, useState } from "react";

/** Nothing to report, the text is on the clipboard, or the browser refused to put it there. */
export type CopyState = "idle" | "copied" | "failed";

const COPIED_MS = 1800;

/**
 * Puts `text` on the clipboard and resolves to whether it got there. Browsers without the async
 * clipboard API, as on a page served over plain http, fall back to copying a selection.
 */
export async function writeClipboard(text: string): Promise<boolean> {
  // Called before any await, so the press that asked for the copy still counts as the gesture.
  const clipboard = globalThis.navigator?.clipboard;
  if (typeof clipboard?.writeText !== "function") return copySelection(text);
  try {
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function copySelection(text: string): boolean {
  const document = globalThis.document;
  if (typeof document?.execCommand !== "function") return false;
  const focused = document.activeElement as HTMLElement | null;
  const field = document.createElement("textarea");
  field.value = text;
  field.readOnly = true;
  // 16px keeps iOS from zooming in on the field while it is selected.
  field.style.cssText = "position:fixed;top:0;left:0;opacity:0;font-size:16px";
  document.body.append(field);
  field.select();
  field.setSelectionRange(0, text.length);
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {}
  field.remove();
  focused?.focus?.({ preventScroll: true });
  return copied;
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
