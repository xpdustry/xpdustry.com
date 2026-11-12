import { useEffect, useRef, useState } from "react";

const SHOWN_MS = 1400;

/** Copies `text` on `copy()`, and reports `copied` for a moment afterwards. */
export function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = () => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), SHOWN_MS);
  };
  return { copied, copy };
}
