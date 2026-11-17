import { expect, test } from "vitest";
import { playerCount } from "./live";
import { HUB } from "./servers";
import type { ServerInfo, ServerSnapshotItem } from "./snapshots";

const playing = (players: number): ServerSnapshotItem => ({
  ...HUB,
  status: "online",
  info: { players } as ServerInfo
});
const offline: ServerSnapshotItem = { ...HUB, status: "offline" };
const polling: ServerSnapshotItem = { ...HUB, status: "polling" };

test.each([
  [
    "the players of every server online",
    [playing(7), offline, playing(3)],
    { state: "online", players: 10 }
  ],
  [
    "no one, while a server answers with nobody",
    [playing(0), polling],
    { state: "online", players: 0 }
  ],
  [
    "no one for a server that reports fewer than nobody",
    [playing(-4), playing(3)],
    { state: "online", players: 3 }
  ],
  ["that it is still checking until a server answers", [offline, polling], { state: "polling" }],
  ["that every server is down", [offline, offline], { state: "offline" }]
] as const)("the player count says %s", (_label, servers, count) => {
  expect(playerCount(servers)).toEqual(count);
});
