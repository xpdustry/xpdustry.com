import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import * as styles from "./SlowNavigation.css";

const SHOWN_AFTER_MS = 400;

export function SlowNavigation() {
  const changingPage = useRouterState({
    select: ({ status, location, resolvedLocation }) =>
      status === "pending" && location.pathname !== resolvedLocation?.pathname
  });
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!changingPage) return;
    const timer = setTimeout(() => setSlow(true), SHOWN_AFTER_MS);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [changingPage]);
  return slow && <div className={styles.bar} data-slow-navigation="" aria-hidden="true" />;
}
