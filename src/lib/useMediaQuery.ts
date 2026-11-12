import { useCallback, useSyncExternalStore } from "react";

/**
 * Whether `query` matches, live. The server, which has no viewport, renders `serverValue`; the
 * first client render agrees with it, and the real value follows right after hydration.
 */
export function useMediaQuery(query: string, serverValue: boolean): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => matchMedia(query).matches,
    () => serverValue,
  );
}
