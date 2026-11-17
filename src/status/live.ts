import type { ProjectSlug } from "#app/brand/projects";
import type { ServerInfo, ServerSnapshot, ServerSnapshotItem } from "./snapshots";

export interface DiscordCounts {
  members: number;
  online: number;
}

export interface LiveData {
  servers: ServerSnapshot;
  discord?: DiscordCounts;
  releases: Partial<Record<ProjectSlug, string>>;
}

export function findServer(snapshot: ServerSnapshot, slug: string): ServerSnapshotItem | undefined {
  return snapshot.servers.find((server) => server.slug === slug);
}

export type PlayerCount =
  | { state: "online"; players: number }
  | { state: "polling" }
  | { state: "offline" };

const shownPlayers = (info: ServerInfo) => Math.max(info.players, 0);

export function playerCount(servers: readonly ServerSnapshotItem[]): PlayerCount {
  const online = servers.filter((server) => server.status === "online");
  if (online.length > 0) {
    return {
      state: "online",
      players: online.reduce((total, server) => total + shownPlayers(server.info), 0)
    };
  }
  return servers.some((server) => server.status === "polling")
    ? { state: "polling" }
    : { state: "offline" };
}
