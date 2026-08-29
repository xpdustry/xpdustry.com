import { query } from "@solidjs/router";
import {
  OFFLINE_SERVER_SNAPSHOT,
  parseServerSnapshot,
  type ServerSnapshot,
} from "#app/data/snapshots";

export const getServerSnapshot = query(async (): Promise<ServerSnapshot> => {
  if (import.meta.env.SSR) {
    const { readServerSnapshot } = await import("#app/server/runtime");
    return readServerSnapshot();
  }
  try {
    const response = await fetch("/api/servers", {
      headers: { accept: "application/json" },
    });
    if (!response.ok) {
      return OFFLINE_SERVER_SNAPSHOT;
    }
    return parseServerSnapshot(await response.json());
  } catch {
    return OFFLINE_SERVER_SNAPSHOT;
  }
}, "servers");
