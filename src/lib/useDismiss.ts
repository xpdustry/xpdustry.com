import { useEffect, type RefObject } from "react";

/**
 * While `open`, closes on Escape and on a press outside `within`. Escape hands the focus back to
 * `returnTo` when it was inside, so it is not left on something that is gone.
 */
export function useDismiss({
  open,
  within,
  returnTo,
  close,
}: {
  open: boolean;
  within: RefObject<HTMLElement | null>;
  returnTo: RefObject<HTMLElement | null>;
  close: () => void;
}): void {
  useEffect(() => {
    if (!open) return;
    const inside = (node: unknown) => within.current?.contains(node as Node) ?? false;
    const dismiss = (event: KeyboardEvent | PointerEvent) => {
      if (event instanceof KeyboardEvent) {
        if (event.key !== "Escape") return;
        if (inside(document.activeElement)) returnTo.current?.focus();
      } else if (inside(event.target)) return;
      close();
    };
    addEventListener("keydown", dismiss);
    addEventListener("pointerdown", dismiss);
    return () => {
      removeEventListener("keydown", dismiss);
      removeEventListener("pointerdown", dismiss);
    };
  }, [open, within, returnTo, close]);
}
