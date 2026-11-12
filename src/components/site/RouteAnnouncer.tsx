import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import * as styles from "./RouteAnnouncer.css";

/**
 * Focuses where a page opened by the router starts: the section its address points to, else its
 * heading, else its main landmark, whichever is drawn as a box of its own (a heading laid out with
 * `display: contents` cannot take the focus). Without scrolling, which the router restores itself.
 * The element becomes focusable for the occasion only.
 */
function focusDestination(hash: string) {
  const main = document.getElementById("main");
  const target = [hash && document.getElementById(hash), main?.querySelector("h1"), main].find(
    (candidate): candidate is HTMLElement =>
      candidate instanceof HTMLElement && candidate.getClientRects().length > 0,
  );
  if (!target) return;
  const focusable = target.hasAttribute("tabindex");
  if (!focusable) target.setAttribute("tabindex", "-1");
  target.classList.add(styles.landing);
  const leave = () => {
    target.classList.remove(styles.landing);
    if (!focusable) target.removeAttribute("tabindex");
  };
  target.addEventListener("blur", leave, { once: true });
  target.focus({ preventScroll: true });
}

/**
 * Says which page opened after a navigation the router handled, as a full page load would: a
 * screen reader hears the new title, and the focus moves into the new page instead of falling to
 * the body. A change of hash or search alone, such as the skip link, is left to the browser.
 */
export function RouteAnnouncer() {
  const router = useRouter();
  const [title, setTitle] = useState("");

  useEffect(
    () =>
      router.subscribe("onRendered", ({ pathChanged, toLocation }) => {
        if (!pathChanged) return;
        requestAnimationFrame(() => {
          setTitle(document.title);
          focusDestination(toLocation.hash);
        });
      }),
    [router],
  );

  return (
    <output className="sr-only" aria-live="polite" aria-atomic="true">
      {title}
    </output>
  );
}
