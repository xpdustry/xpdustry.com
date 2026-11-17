import { useRouter } from "@tanstack/react-router";
import { useEffect, type RefObject } from "react";
import { stopMoving } from "#app/ui/popoverMotion";

export function useShutPopovers(within: RefObject<HTMLElement | null>) {
  const router = useRouter();
  useEffect(() => {
    const shut = (animate: boolean) => {
      for (const popover of within.current?.querySelectorAll<HTMLElement>(":popover-open") ?? []) {
        popover.hidePopover();
        if (!animate) stopMoving(popover);
      }
    };
    const shutAnimated = () => shut(true);
    const shutStill = () => shut(false);
    const followed = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest(":popover-open a[href]")) {
        shutAnimated();
      }
    };
    const restored = (event: PageTransitionEvent) => event.persisted && shutStill();
    const shown = new Map<Element, boolean>();
    const refolded = new ResizeObserver((entries) => {
      let folded = false;
      for (const { target, contentRect } of entries) {
        const nowShown = contentRect.width > 0;
        folded ||= shown.has(target) && shown.get(target) !== nowShown;
        shown.set(target, nowShown);
      }
      if (folded) shutStill();
    });

    const header = within.current;
    header?.addEventListener("click", followed);
    addEventListener("pageshow", restored);
    for (const control of header?.querySelectorAll(":scope > :not([popover])") ?? []) {
      refolded.observe(control);
    }
    const unsubscribe = router.subscribe(
      "onBeforeNavigate",
      (event) => event.hrefChanged && shutAnimated()
    );
    return () => {
      header?.removeEventListener("click", followed);
      removeEventListener("pageshow", restored);
      refolded.disconnect();
      unsubscribe();
    };
  }, [router, within]);
}
