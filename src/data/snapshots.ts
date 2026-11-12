import type { ServerDefinition } from "#app/data/servers";

/** What a server answers a status query with, its Mindustry markup stripped. */
export interface ServerInfo {
  name: string;
  description: string;
  map: string;
  mode: string;
  players: number;
  playerLimit: number;
  wave: number;
  version: number;
  versionType: string;
}

export type ServerSnapshotItem = ServerDefinition &
  ({ status: "polling" } | { status: "online"; info: ServerInfo } | { status: "offline" });

export type OnlineServerSnapshotItem = Extract<ServerSnapshotItem, { status: "online" }>;

export interface ServerSnapshot {
  servers: ServerSnapshotItem[];
}
