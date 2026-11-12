import { useRouter } from "@tanstack/react-router";
import { useEffect, type RefObject, type ToggleEvent, type TransitionEvent } from "react";
import { MOVING } from "./popover";

/**
 * A popover's handlers that mark it as moving while the visitor opens or shuts it, so that it
 * animates then and not when a resize moves it in or out of the page's layout.
 */
export const moving = {
  onBeforeToggle: (event: ToggleEvent<HTMLElement>) => event.currentTarget.setAttribute(MOVING, ""),
  onTransitionEnd: (event: TransitionEvent<HTMLElement>) => {
    if (event.target === event.currentTarget) event.currentTarget.removeAttribute(MOVING);
  }
};

/**
 * Shuts the popovers open inside `within` once what they float over is gone or moved: a link
 * followed from one of them, any other navigation including Back and Forward, a return from the
 * back/forward cache, and a resize across one of `folds`. The browser itself shuts them on Escape,
 * on a press outside and when another opens, and hands the focus back to their button.
 */
export function useShutPopovers(within: RefObject<HTMLElement | null>, folds: readonly string[]) {
  const router = useRouter();
  useEffect(() => {
    const shut = (animate: boolean) => {
      for (const popover of within.current?.querySelectorAll<HTMLElement>(":popover-open") ?? []) {
        popover.hidePopover();
        if (!animate) popover.removeAttribute(MOVING);
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
