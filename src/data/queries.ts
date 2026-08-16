/**
 * The snapshot read, written once for both sides of the wire.
 *
 * On the server it reads the poller's memory directly, with no HTTP hop. In
 * the browser it fetches the same JSON from `/api/servers`. Because both
 * paths return the identical shape, a page renders the same whether the
 * snapshot arrived with the HTML or after hydration, and a failed fetch
 * degrades to the explicit unavailable state rather than an empty page.
 *
 * `import.meta.env.SSR` is a compile-time constant, so the server import is
 * eliminated from the client bundle along with everything it would drag in.
 */

import { query } from "@solidjs/router";
import { EMPTY_SERVER_SNAPSHOT } from "#app/data/snapshots";
import type { ServerSnapshot } from "#app/data/snapshots";

export const getServerSnapshot = query(async (): Promise<ServerSnapshot> => {
  if (import.meta.env.SSR) {
    const { readServerSnapshot } = await import("#app/server/runtime");
    return readServerSnapshot();
  }
  return fetchSnapshot("/api/servers", EMPTY_SERVER_SNAPSHOT);
}, "servers");

async function fetchSnapshot<T extends { state: string }>(path: string, empty: T): Promise<T> {
  try {
    const response = await fetch(path, {
      headers: { accept: "application/json" },
    });
    if (!response.ok) {
      return { ...empty, state: "unavailable" };
    }
    return (await response.json()) as T;
  } catch {
    return { ...empty, state: "unavailable" };
  }
}
