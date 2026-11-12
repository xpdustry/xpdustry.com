import { useGT } from "gt-tanstack-start";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PlinthButton, type PlinthStyle } from "#app/components/ui/Plinth";
import { Check, Copy } from "#app/lib/icons";

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
  const gt = useGT();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = () => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), SHOWN_MS);
  };

  const named = typeof children !== "function" && Boolean(children);
  const face =
    typeof children === "function" ? (
      children(copied)
    ) : children ? (
      copied ? (
        gt("Copied")
      ) : (
        children
      )
    ) : copied ? (
      <Check />
    ) : (
      <Copy />
    );
  return (
    <>
      <PlinthButton
        tone={tone}
        size="sm"
        icon={!children}
        done={!named && copied}
        className={className}
        onClick={copy}
        {...(!named && { "aria-label": label, title: gt("Copy address") })}
      >
        {face}
      </PlinthButton>
      <output className="sr-only">{copied ? gt("Copied {text}", { text }) : ""}</output>
    </>
  );
}
