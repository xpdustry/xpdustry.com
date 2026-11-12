import type { ProjectSlug } from "#app/data/projects";
import type { ServerSnapshot, ServerSnapshotItem } from "#app/data/snapshots";

export interface DiscordCounts {
  members: number;
  online: number;
}

/** Everything on the home page that changes without a deploy. */
export interface LiveData {
  servers: ServerSnapshot;
  /** Absent until Discord has answered once. */
  discord?: DiscordCounts;
  /** Each project's newest release tag; projects GitHub has not answered for are absent. */
  releases: Partial<Record<ProjectSlug, string>>;
}

export function findServer(snapshot: ServerSnapshot, slug: string): ServerSnapshotItem | undefined {
  return snapshot.servers.find((server) => server.slug === slug);
}

/** What the player count of a set of servers reads: a number, or why there is none. */
export type PlayerCount =
  | { state: "online"; players: number }
  | { state: "polling" }
  | { state: "offline" };

export function playerCount(servers: readonly ServerSnapshotItem[]): PlayerCount {
  const online = servers.filter((server) => server.status === "online");
  if (online.length > 0) {
    return {
      state: "online",
      players: online.reduce((total, server) => total + server.info.players, 0),
    };
  }
  return servers.some((server) => server.status === "polling")
    ? { state: "polling" }
    : { state: "offline" };
}
