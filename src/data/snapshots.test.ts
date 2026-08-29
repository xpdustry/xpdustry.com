import { describe, expect, test } from "vitest";
import { createServerSnapshot, parseServerSnapshot, type ServerInfo } from "#app/data/snapshots";

const identity = {
  slug: "hub",
  label: "Hub",
  hostname: "hub.md.xpdustry.com",
};

const info = {
  name: "Hub",
  description: "",
  map: "Ground Zero",
  mode: "survival",
  players: 3,
  playerLimit: 50,
  wave: 1,
  version: 159,
  versionType: "official",
} satisfies ServerInfo;

describe("server snapshots", () => {
  test("parses each supported server status", () => {
    const snapshot = parseServerSnapshot({
      servers: [
        { ...identity, status: "polling" },
        { ...identity, slug: "survival", status: "online", info },
        { ...identity, slug: "pvp", status: "offline" },
      ],
    });

    expect(snapshot.servers.map((server) => server.status)).toEqual([
      "polling",
      "online",
      "offline",
    ]);
  });

  test.each([
    ["online without info", { servers: [{ ...identity, status: "online" }] }],
    ["offline with stale info", { servers: [{ ...identity, status: "offline", info }] }],
    ["the legacy boolean shape", { servers: [{ ...identity, online: true, info }] }],
  ])("rejects %s", (_case, snapshot) => {
    expect(() => parseServerSnapshot(snapshot)).toThrow();
  });

  test("constructs initial and failed snapshots without fake online fields", () => {
    expect(createServerSnapshot([identity], "polling")).toEqual({
      servers: [{ ...identity, status: "polling" }],
    });
    expect(createServerSnapshot([identity], "offline")).toEqual({
      servers: [{ ...identity, status: "offline" }],
    });
  });
});
