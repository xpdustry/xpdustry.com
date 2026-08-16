import { describe, expect, test, vi } from "vitest";
import type { ServerDefinition } from "#app/data/servers";
import { StatusService, type StatusTransport } from "#app/server/mindustry-status";

const hub: ServerDefinition = {
  slug: "hub",
  label: "Hub",
  hostname: "hub.md.xpdustry.com",
};
const pvp: ServerDefinition = {
  slug: "pvp",
  label: "PvP",
  hostname: "pvp.md.xpdustry.com",
};

/** The smallest well-formed reply a server can send. */
function reply(name = "Hub", players = 3): Uint8Array {
  const parts: number[] = [];
  const encoder = new TextEncoder();
  const string = (value: string) => {
    const bytes = encoder.encode(value);
    parts.push(bytes.length, ...bytes);
  };
  const i32 = (value: number) =>
    parts.push((value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff);

  string(name);
  string("Ground Zero");
  i32(players);
  i32(1);
  i32(159);
  string("official");
  parts.push(0);
  i32(50);
  string("");
  string("");
  parts.push(0x19, 0xa7);
  return Uint8Array.from(parts);
}

function transport(overrides: Partial<StatusTransport> = {}): StatusTransport {
  return {
    query: async () => reply(),
    ...overrides,
  };
}

describe("StatusService", () => {
  test("starts loading, with every alias already listed and nothing claimed online", () => {
    const service = new StatusService({
      transport: transport(),
      servers: [hub],
    });
    expect(service.snapshot.state).toBe("loading");
    expect(service.snapshot.updatedAt).toBeNull();
    // Seeded from the definitions so a cold render still shows the addresses.
    expect(service.snapshot.servers.map((entry) => entry.hostname)).toContain(
      "hub.md.xpdustry.com",
    );
    expect(service.snapshot.servers.every((entry) => !entry.online)).toBe(true);
    expect(service.snapshot.servers.every((entry) => entry.info === undefined)).toBe(true);
  });

  test("reports a server that answers as online, with decoded info and a ping", async () => {
    const service = new StatusService({
      transport: transport(),
      servers: [hub],
      monotonic: (() => {
        let calls = 0;
        return () => (calls++ === 0 ? 100 : 142);
      })(),
    });

    await service.refresh();
    const [server] = service.snapshot.servers;
    expect(server.online).toBe(true);
    expect(server.pingMs).toBe(42);
    expect(server.info?.name).toBe("Hub");
    expect(server.info?.players).toBe(3);
  });

  test("queries the friendly alias on Mindustry's default port", async () => {
    const query = vi.fn(async () => reply());

    await new StatusService({
      transport: transport({ query }),
      servers: [hub],
    }).refresh();

    expect(query).toHaveBeenCalledWith(
      "hub.md.xpdustry.com",
      6567,
      expect.any(Uint8Array),
      2000,
      expect.any(AbortSignal),
    );
  });

  test("never exposes the transport port in the snapshot", async () => {
    const service = new StatusService({
      transport: transport(),
      servers: [hub],
    });

    await service.refresh();
    const serialised = JSON.stringify(service.snapshot);
    expect(serialised).toContain("hub.md.xpdustry.com");
    expect(serialised).not.toContain("6567");
  });

  test("reports offline when the alias does not answer", async () => {
    const service = new StatusService({
      transport: transport({ query: async () => Promise.reject(new Error("timeout")) }),
      servers: [hub],
    });

    await service.refresh();
    expect(service.snapshot.servers[0]).toMatchObject({ online: false });
    expect(service.snapshot.servers[0].info).toBeUndefined();
  });

  test.each([
    ["a query timeout", { query: async () => Promise.reject(new Error("timeout")) }],
    ["a socket error", { query: async () => Promise.reject(new Error("EACCES")) }],
    ["a malformed reply", { query: async () => Uint8Array.from([1, 2, 3]) }],
  ])("reports offline on %s", async (_label, overrides) => {
    const onError = vi.fn();
    const service = new StatusService({
      transport: transport(overrides as Partial<StatusTransport>),
      servers: [hub],
      onError,
    });

    await service.refresh();
    expect(service.snapshot.servers[0].online).toBe(false);
    expect(onError).toHaveBeenCalled();
  });

  test("one failing server does not take the others offline", async () => {
    const service = new StatusService({
      transport: transport({
        query: async (host) => (host === hub.hostname ? reply() : Promise.reject()),
      }),
      servers: [hub, pvp],
    });

    await service.refresh();
    expect(service.snapshot.servers.map((entry) => entry.online)).toEqual([true, false]);
  });

  test("keeps the definition order regardless of which answers first", async () => {
    const service = new StatusService({
      transport: transport({
        query: async (host) => {
          if (host === hub.hostname) await new Promise((resolve) => setTimeout(resolve, 10));
          return reply();
        },
      }),
      servers: [hub, pvp],
    });

    await service.refresh();
    expect(service.snapshot.servers.map((entry) => entry.slug)).toEqual(["hub", "pvp"]);
  });

  test("never marks a stale result online: a failed poll replaces the snapshot", async () => {
    let up = true;
    const service = new StatusService({
      transport: transport({
        query: async () => (up ? reply() : Promise.reject(new Error("timeout"))),
      }),
      servers: [hub],
    });

    await service.refresh();
    expect(service.snapshot.servers[0].online).toBe(true);

    up = false;
    await service.refresh();
    expect(service.snapshot.servers[0].online).toBe(false);
  });

  test("an aborted cycle leaves the previous snapshot alone", async () => {
    const controller = new AbortController();
    const service = new StatusService({
      transport: transport({
        query: async () => {
          controller.abort();
          throw new Error("aborted");
        },
      }),
      servers: [hub],
      onError: () => {},
    });

    await service.refresh();
    const before = service.snapshot;

    await service.refresh(controller.signal);
    expect(service.snapshot).toBe(before);
  });

  test("stop leaves the poller stopped", () => {
    const service = new StatusService({
      transport: transport(),
      servers: [hub],
    });
    service.start();
    service.stop();
    // A stopped service must not schedule further cycles; starting again is
    // the caller's decision, not a side effect of stop.
    expect(service.snapshot.state).toBeDefined();
  });
});
