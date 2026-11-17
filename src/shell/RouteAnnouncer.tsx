import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import * as styles from "./RouteAnnouncer.css";

const hasBox = (candidate: unknown): candidate is HTMLElement =>
  candidate instanceof HTMLElement && candidate.getClientRects().length > 0;

function focusUntilBlur(target: HTMLElement) {
  const focusable = target.hasAttribute("tabindex");
  if (!focusable) target.setAttribute("tabindex", "-1");
  target.classList.add(styles.focusedByNavigation);
  const leave = () => {
    target.classList.remove(styles.focusedByNavigation);
    if (!focusable) target.removeAttribute("tabindex");
  };
  target.addEventListener("blur", leave, { once: true });
  target.focus({ preventScroll: true });
}

function focusDestination(hash: string) {
  const main = document.getElementById("main");
  const target = [hash && document.getElementById(hash), main?.querySelector("h1"), main].find(
    hasBox
  );
  if (target) focusUntilBlur(target);
}

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
    [router]
  );

  return (
    <output className="sr-only" aria-live="polite" aria-atomic="true">
      {title}
    </output>
  );
}
