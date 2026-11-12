import { expect, test } from "vitest";
import type { ServerDefinition } from "#app/data/servers";
import type { ServerInfo } from "#app/data/snapshots";
import { queryServers } from "#app/server/mindustry/status";

const hub: ServerDefinition = { slug: "hub", label: "Hub", hostname: "hub.md.xpdustry.com" };
const pvp: ServerDefinition = { slug: "pvp", label: "PvP", hostname: "pvp.md.xpdustry.com" };
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
const live = () => new AbortController().signal;

test("one failed server does not affect the other results", async () => {
  const snapshot = await queryServers(
    {
      query: async (hostname) => {
        if (hostname === pvp.hostname) throw new Error("offline");
        return info;
      },
    },
    [hub, pvp],
    live(),
  );

  expect(snapshot.servers).toEqual([
    { ...hub, status: "online", info },
    { ...pvp, status: "offline" },
  ]);
});

test("answers only once every server has settled", async () => {
  const late = Promise.withResolvers<ServerInfo>();
  let settled = false;
  const pending = queryServers(
    { query: (hostname) => (hostname === hub.hostname ? Promise.resolve(info) : late.promise) },
    [hub, pvp],
    live(),
  ).then((snapshot) => {
    settled = true;
    return snapshot;
  });

  await new Promise((resolve) => setImmediate(resolve));
  expect(settled).toBe(false);

  late.resolve(info);
  expect((await pending).servers.every((server) => server.status === "online")).toBe(true);
});

test("an aborted round throws instead of reporting everything offline", async () => {
  const controller = new AbortController();
  const pending = queryServers(
    {
      query: (_hostname, signal) =>
        new Promise((_resolve, reject) =>
          signal.addEventListener("abort", () => reject(signal.reason)),
        ),
    },
    [hub],
    controller.signal,
  );
  controller.abort();

  await expect(pending).rejects.toThrow();
});
