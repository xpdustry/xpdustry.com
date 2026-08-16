/**
 * The wire shape the poller produces and the pages read.
 *
 * These types cross the server/client line: SSR reads them straight out of
 * memory, the browser gets the identical JSON from `/api/servers`. Nothing
 * secret belongs in here: no resolved SRV targets, no ports.
 */

import { servers } from "#app/data/servers";
import type { ServerInfo } from "#app/server/mindustry-protocol";

export type SnapshotState = "loading" | "ready" | "unavailable";

export interface ServerSnapshotItem {
  slug: string;
  label: string;
  /** The friendly alias only. Never the resolved host or port. */
  hostname: string;
  online: boolean;
  polledAt: string;
  pingMs?: number;
  info?: ServerInfo;
}

export interface ServerSnapshot {
  state: SnapshotState;
  updatedAt: string | null;
  servers: ServerSnapshotItem[];
}

/**
 * The state a cold process serves.
 *
 * Not literally empty: the snapshot is seeded from the local definitions, so
 * a page rendered before the first poll still has every server address on it.
 * Only the polled values are missing, and each card says so. That makes the
 * addresses copyable immediately and means nothing reflows when data lands.
 */

export const EMPTY_SERVER_SNAPSHOT: ServerSnapshot = {
  state: "loading",
  updatedAt: null,
  servers: servers.map((server) => ({
    slug: server.slug,
    label: server.label,
    hostname: server.hostname,
    online: false,
    polledAt: "",
  })),
};
