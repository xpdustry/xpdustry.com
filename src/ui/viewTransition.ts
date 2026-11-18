import { useRouter, type ParsedLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { shutAtOnce } from "./popoverMotion";
import { media } from "./styles/media";
import { IN_VIEW, LEAVING, TRANSITION, traveller, type TransitionType } from "./viewTransition.css";

interface LocationChange {
  fromLocation?: ParsedLocation;
  toLocation: ParsedLocation;
  pathChanged: boolean;
}

const depth = (pathname: string) => pathname.split("/").filter(Boolean).length;
const isPost = (pathname: string) => /^\/blog\/[^/]+\/?$/.test(pathname);
const historyIndex = (location: ParsedLocation) => location.state.__TSR_index ?? 0;

export function transitionTypes({
  fromLocation: from,
  toLocation: to,
  pathChanged
}: LocationChange): TransitionType[] | false {
  if (!from || !pathChanged) return false;
  const descent =
    depth(to.pathname) - depth(from.pathname) || historyIndex(to) - historyIndex(from);
  const types: TransitionType[] = [descent < 0 ? TRANSITION.shallower : TRANSITION.deeper];
  if (isPost(from.pathname) !== isPost(to.pathname)) types.push(TRANSITION.post);
  return types;
}

/**
 * The router asks for the types right before the browser captures the page being left, after
 * the next page has loaded, so this is when that page is readied for its snapshot.
 */
export function typesReadyingTheCapture(change: LocationChange) {
  const types = transitionTypes(change);
  if (types) {
    for (const popover of document.querySelectorAll<HTMLElement>("[popover]")) shutAtOnce(popover);
    document.getElementById("main")?.setAttribute(LEAVING, "");
    markTravellersInView();
  }
  return types;
}

function markTravellersInView() {
  for (const element of document.getElementsByClassName(traveller)) {
    const { top, bottom } = element.getBoundingClientRect();
    element.toggleAttribute(IN_VIEW, bottom > 0 && top < innerHeight);
  }
}

export function useTransitionCues() {
  const router = useRouter();
  useEffect(
    () =>
      router.subscribe("onRendered", () => {
        document.getElementById("main")?.removeAttribute(LEAVING);
        markTravellersInView();
      }),
    [router]
  );
  useEffect(() => {
    const less = matchMedia(media.still);
    const skipRunningTransition = () => {
      if (less.matches) document.activeViewTransition?.skipTransition();
    };
    less.addEventListener("change", skipRunningTransition);
    return () => less.removeEventListener("change", skipRunningTransition);
  }, []);
}
