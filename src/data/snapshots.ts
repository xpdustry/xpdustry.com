import * as v from "valibot";
import { servers, type ServerDefinition } from "#app/data/servers";
import { NonBlankStringSchema } from "#app/lib/schema";

const ServerIdentityEntries = {
  slug: NonBlankStringSchema,
  label: NonBlankStringSchema,
  hostname: NonBlankStringSchema,
};

export const ServerInfoSchema = v.strictObject({
  name: v.string(),
  description: v.string(),
  map: v.string(),
  mode: v.string(),
  players: v.pipe(v.number(), v.integer(), v.minValue(0)),
  playerLimit: v.pipe(v.number(), v.integer(), v.minValue(0)),
  wave: v.pipe(v.number(), v.integer(), v.minValue(0)),
  version: v.pipe(v.number(), v.integer()),
  versionType: v.string(),
});

const PollingServerSchema = v.strictObject({
  ...ServerIdentityEntries,
  status: v.literal("polling"),
});

const OnlineServerSchema = v.strictObject({
  ...ServerIdentityEntries,
  status: v.literal("online"),
  info: ServerInfoSchema,
});

const OfflineServerSchema = v.strictObject({
  ...ServerIdentityEntries,
  status: v.literal("offline"),
});

export const ServerSnapshotItemSchema = v.variant("status", [
  PollingServerSchema,
  OnlineServerSchema,
  OfflineServerSchema,
]);

export const ServerSnapshotSchema = v.strictObject({
  servers: v.array(ServerSnapshotItemSchema),
});

export type ServerInfo = v.InferOutput<typeof ServerInfoSchema>;
export type ServerSnapshotItem = v.InferOutput<typeof ServerSnapshotItemSchema>;
export type OnlineServerSnapshotItem = Extract<ServerSnapshotItem, { status: "online" }>;
export type ServerStatus = ServerSnapshotItem["status"];
export type ServerSnapshot = v.InferOutput<typeof ServerSnapshotSchema>;

export function createServerSnapshot(
  definitions: readonly ServerDefinition[],
  status: Exclude<ServerStatus, "online">,
): ServerSnapshot {
  return {
    servers: definitions.map((server) => ({ ...server, status })),
  };
}

export function parseServerSnapshot(input: unknown): ServerSnapshot {
  return v.parse(ServerSnapshotSchema, input);
}

export const POLLING_SERVER_SNAPSHOT = createServerSnapshot(servers, "polling");
export const OFFLINE_SERVER_SNAPSHOT = createServerSnapshot(servers, "offline");
