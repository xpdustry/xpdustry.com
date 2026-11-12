import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Copy } from "#app/components/ui/Icons";
import { PlinthButton, type PlinthStyle } from "#app/components/ui/Plinth";

const SHOWN_MS = 1400;

interface CopyButtonProps {
  text: string;
  /** The accessible name of a button without text of its own, as in "Copy hub.md.xpdustry.com". */
  label: string;
  /**
   * A text button instead of an icon; the text reads "Copied" for a moment after a copy. Or a
   * function drawing the button's face, told whether a copy just landed; `label` names it.
   */
  children?: ReactNode | ((copied: boolean) => ReactNode);
  tone?: PlinthStyle["tone"];
  className?: string;
}

/** Copies `text`, then shows a check (or "Copied") for a moment and says so to screen readers. */
export function CopyButton({ text, label, children, tone = "ink", className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = () => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), SHOWN_MS);
  };

  const style = { tone, size: "sm", className, onClick: copy } as const;
  return (
    <>
      {typeof children === "function" ? (
        <PlinthButton {...style} done={copied} aria-label={label} title="Copy address">
          {children(copied)}
        </PlinthButton>
      ) : children ? (
        <PlinthButton {...style}>{copied ? "Copied" : children}</PlinthButton>
      ) : (
        <PlinthButton {...style} icon done={copied} aria-label={label} title="Copy address">
          {copied ? <Check /> : <Copy />}
        </PlinthButton>
      )}
      <output className="sr-only">{copied ? `Copied ${text}` : ""}</output>
    </>
  );
}
