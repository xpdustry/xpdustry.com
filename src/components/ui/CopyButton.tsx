import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Copy } from "#app/components/ui/Icons";
import { PlinthButton } from "#app/components/ui/Plinth";

const SHOWN_MS = 1400;

interface CopyButtonProps {
  text: string;
  /** The accessible name of the icon-only button, as in "Copy hub.md.xpdustry.com". */
  label: string;
  /** A text button instead of an icon; the text reads "Copied" for a moment after a copy. */
  children?: ReactNode;
  className?: string;
}

/** Copies `text`, then shows a check (or "Copied") for a moment and says so to screen readers. */
export function CopyButton({ text, label, children, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = () => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), SHOWN_MS);
  };

  return (
    <>
      {children ? (
        <PlinthButton tone="ink" size="sm" className={className} onClick={copy}>
          {copied ? "Copied" : children}
        </PlinthButton>
      ) : (
        <PlinthButton
          tone="ink"
          size="sm"
          icon
          done={copied}
          className={className}
          aria-label={label}
          title="Copy address"
          onClick={copy}
        >
          {copied ? <Check /> : <Copy />}
        </PlinthButton>
      )}
      <output className="sr-only">{copied ? `Copied ${text}` : ""}</output>
    </>
  );
}
