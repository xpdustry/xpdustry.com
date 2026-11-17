import { useRouter } from "@tanstack/react-router";
import { useEffect, type RefObject } from "react";
import { stopMoving } from "#app/ui/popoverMotion";

export function useShutPopovers(within: RefObject<HTMLElement | null>, folds: readonly string[]) {
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
    const queries = folds.map((fold) => matchMedia(fold));

    const header = within.current;
    header?.addEventListener("click", followed);
    addEventListener("pageshow", restored);
    for (const query of queries) query.addEventListener("change", shutStill);
    const unsubscribe = router.subscribe(
      "onBeforeNavigate",
      (event) => event.hrefChanged && shutAnimated()
    );
    return () => {
      header?.removeEventListener("click", followed);
      removeEventListener("pageshow", restored);
      for (const query of queries) query.removeEventListener("change", shutStill);
      unsubscribe();
    };
  }, [router, within, folds]);
}
