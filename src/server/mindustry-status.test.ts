import { describe, expect, test, vi } from "vitest";
import type { ServerDefinition } from "#app/data/servers";
import type { ServerInfo } from "#app/data/snapshots";
import {
  StatusService,
  type MindustryStatusProbe,
  type ScheduledTask,
  type StatusClock,
} from "#app/server/mindustry-status";

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

function probe(query: MindustryStatusProbe["query"] = async () => info): MindustryStatusProbe {
  return { query };
}

function fakeClock() {
  const pending: { handler: () => void; delayMs: number; task: ScheduledTask }[] = [];
  const clock: StatusClock = {
    schedule(handler, delayMs) {
      const entry = {
        handler,
        delayMs,
        task: { cancel: () => pending.splice(pending.indexOf(entry), 1) },
      };
      pending.push(entry);
      return entry.task;
    },
  };

  return {
    clock,
    get scheduled() {
      return pending.map((entry) => entry.delayMs);
    },
    fire() {
      const entry = pending.shift();
      if (!entry) throw new Error("nothing scheduled");
      entry.handler();
    },
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("StatusService snapshots", () => {
  test("seeds a cold snapshot from the injected definitions", () => {
    const service = new StatusService({ probe: probe(), servers: [pvp] });

    expect(service.snapshot).toEqual({
      servers: [
        {
          slug: "pvp",
          label: "PvP",
          hostname: "pvp.md.xpdustry.com",
          status: "polling",
        },
      ],
    });
  });

  test("publishes decoded status without endpoint details", async () => {
    const service = new StatusService({
      probe: probe(),
      servers: [hub],
    });

    await service.refresh();

    expect(service.snapshot.servers[0]).toMatchObject({
      hostname: "hub.md.xpdustry.com",
      status: "online",
      info,
    });
    expect(JSON.stringify(service.snapshot)).not.toContain("6567");
  });

  test("one failed server does not affect the other results", async () => {
    const service = new StatusService({
      probe: probe(async (hostname) => {
        if (hostname === pvp.hostname) throw new Error("offline");
        return info;
      }),
      servers: [hub, pvp],
    });

    await service.refresh();

    expect(service.snapshot.servers.map((entry) => entry.status)).toEqual(["online", "offline"]);
  });

  test("replaces stale online data after a failed cycle", async () => {
    let online = true;
    const service = new StatusService({
      probe: probe(async () => {
        if (!online) throw new Error("offline");
        return info;
      }),
      servers: [hub],
    });

    await service.refresh();
    online = false;
    await service.refresh();

    expect(service.snapshot.servers[0]).toEqual({
      slug: "hub",
      label: "Hub",
      hostname: "hub.md.xpdustry.com",
      status: "offline",
    });
  });

  test("publishes a cycle only after every server settles", async () => {
    const late = deferred<ServerInfo>();
    const service = new StatusService({
      probe: probe((hostname) =>
        hostname === hub.hostname ? Promise.resolve(info) : late.promise,
      ),
      servers: [hub, pvp],
    });

    const refresh = service.refresh();
    await Promise.resolve();
    expect(service.snapshot.servers.every((entry) => entry.status === "polling")).toBe(true);

    late.resolve(info);
    await refresh;
    expect(service.snapshot.servers.every((entry) => entry.status === "online")).toBe(true);
  });

  test("reports poll attempts and completed batches without a parallel readiness state", async () => {
    const timestamps = [new Date("2026-08-29T10:00:00.000Z"), new Date("2026-08-29T10:00:01.000Z")];
    const service = new StatusService({
      probe: probe(),
      servers: [hub],
      now: () => timestamps.shift() ?? new Date("2026-08-29T10:00:01.000Z"),
    });

    await service.refresh();

    expect(service.health).toEqual({
      lastAttemptAt: "2026-08-29T10:00:00.000Z",
      lastCompletedAt: "2026-08-29T10:00:01.000Z",
    });
  });

  test("an aborted cycle leaves the previous snapshot intact", async () => {
    const service = new StatusService({ probe: probe(), servers: [hub] });
    await service.refresh();
    const before = service.snapshot;
    const controller = new AbortController();
    controller.abort();

    await service.refresh(controller.signal);

    expect(service.snapshot).toBe(before);
  });
});

describe("StatusService scheduling", () => {
  test("starts immediately and schedules after the cycle finishes", async () => {
    const gate = deferred<ServerInfo>();
    const timers = fakeClock();
    const query = vi.fn(() => gate.promise);
    const service = new StatusService({
      probe: probe(query),
      servers: [hub],
      clock: timers.clock,
      intervalMs: 1_000,
    });

    service.start();
    service.start();
    expect(query).toHaveBeenCalledOnce();
    expect(timers.scheduled).toEqual([]);

    gate.resolve(info);
    await vi.waitFor(() => expect(timers.scheduled).toEqual([1_000]));
    timers.fire();
    expect(query).toHaveBeenCalledTimes(2);
  });

  test("stop aborts an active cycle", async () => {
    const timers = fakeClock();
    let signal: AbortSignal | undefined;
    const service = new StatusService({
      probe: probe(async (_hostname, activeSignal) => {
        signal = activeSignal;
        return info;
      }),
      servers: [hub],
      clock: timers.clock,
    });

    service.start();
    expect(signal?.aborted).toBe(false);
    service.stop();
    expect(signal?.aborted).toBe(true);
    expect(service.started).toBe(false);

    await Promise.resolve();
    expect(timers.scheduled).toEqual([]);
  });

  test("stop cancels a pending timer", async () => {
    const timers = fakeClock();
    const service = new StatusService({
      probe: probe(),
      servers: [hub],
      clock: timers.clock,
      intervalMs: 1_000,
    });

    service.start();
    await vi.waitFor(() => expect(timers.scheduled).toEqual([1_000]));
    service.stop();

    expect(timers.scheduled).toEqual([]);
  });

  test("a stopped generation cannot schedule after a restart", async () => {
    const first = deferred<ServerInfo>();
    const second = deferred<ServerInfo>();
    const timers = fakeClock();
    const query = vi
      .fn<MindustryStatusProbe["query"]>()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const service = new StatusService({
      probe: probe(query),
      servers: [hub],
      clock: timers.clock,
      intervalMs: 1_000,
    });

    service.start();
    service.stop();
    service.start();
    first.resolve(info);
    await first.promise;
    await Promise.resolve();
    expect(timers.scheduled).toEqual([]);

    second.resolve(info);
    await vi.waitFor(() => expect(timers.scheduled).toEqual([1_000]));
  });

  test("a throwing reporter cannot stop the next cycle", async () => {
    const timers = fakeClock();
    const service = new StatusService({
      probe: probe(async () => {
        throw new Error("offline");
      }),
      servers: [hub],
      clock: timers.clock,
      intervalMs: 1_000,
      onError: () => {
        throw new Error("reporter failed");
      },
    });

    service.start();

    await vi.waitFor(() => expect(timers.scheduled).toEqual([1_000]));
  });
});
