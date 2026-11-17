import type { ServerDefinition } from "./servers";

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

export interface ServerSnapshot {
  servers: ServerSnapshotItem[];
}
