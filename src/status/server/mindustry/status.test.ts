import { expect, test } from "vitest";
import type { ServerDefinition } from "../../servers";
import type { ServerInfo } from "../../snapshots";
import { queryServers } from "./status";

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
  versionType: "official"
} satisfies ServerInfo;
const live = () => new AbortController().signal;

test("answers once every server has settled, one failed server not affecting the others", async () => {
  const late = Promise.withResolvers<ServerInfo>();
  let settled = false;
  const pending = queryServers(
    { query: (hostname) => (hostname === hub.hostname ? Promise.resolve(info) : late.promise) },
    [hub, pvp],
    live()
  ).then((snapshot) => {
    settled = true;
    return snapshot;
  });

  await new Promise((resolve) => setImmediate(resolve));
  expect(settled).toBe(false);

  late.reject(new Error("offline"));
  expect((await pending).servers).toEqual([
    { ...hub, status: "online", info },
    { ...pvp, status: "offline" }
  ]);
});

test("an aborted round throws instead of reporting everything offline", async () => {
  const controller = new AbortController();
  const pending = queryServers(
    {
      query: (_hostname, signal) =>
        new Promise((_resolve, reject) =>
          signal.addEventListener("abort", () => reject(signal.reason))
        )
    },
    [hub],
    controller.signal
  );
  controller.abort();

  await expect(pending).rejects.toThrow();
});
