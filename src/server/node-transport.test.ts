import { describe, expect, test, vi } from "vitest";
import {
  createNodeMindustryProbe,
  type EndpointExchange,
  type SrvRecord,
} from "#app/server/node-transport";

const friendly = "hub.md.xpdustry.com";

function packet(name = "Hub"): Uint8Array {
  const bytes: number[] = [];
  const encoder = new TextEncoder();
  const string = (value: string) => {
    const encoded = encoder.encode(value);
    bytes.push(encoded.length, ...encoded);
  };
  const i32 = (value: number) => {
    bytes.push((value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff);
  };

  string(name);
  string("Ground Zero");
  i32(3);
  i32(1);
  i32(159);
  string("official");
  bytes.push(0);
  i32(50);
  string("");
  string("");
  bytes.push(0x19, 0xa7);
  return Uint8Array.from(bytes);
}

function record(name: string, priority: number, weight = 0, port = 6567): SrvRecord {
  return { name, priority, weight, port };
}

function exchange(
  query: EndpointExchange["query"],
  closeAll: EndpointExchange["closeAll"] = () => {},
): EndpointExchange {
  return { query, closeAll };
}

function signal(): AbortSignal {
  return new AbortController().signal;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("createNodeMindustryProbe", () => {
  test("tries lower priorities first and exhausts a group before the next", async () => {
    const attempts: string[] = [];
    const probe = createNodeMindustryProbe({
      resolveSrv: async () => [
        record("last.example", 20),
        record("first.example", 10),
        record("second.example", 10),
      ],
      exchange: exchange(async (endpoint) => {
        attempts.push(endpoint.hostname);
        throw new Error("offline");
      }),
      random: () => 0,
    });

    await expect(probe.query(friendly, signal())).rejects.toThrow("status query failed");
    expect(attempts).toEqual(["first.example", "second.example", "last.example"]);
  });

  test("uses RFC weighted selection without replacement inside a priority", async () => {
    const attempts: string[] = [];
    const probe = createNodeMindustryProbe({
      resolveSrv: async () => [record("light.example", 10, 1), record("heavy.example", 10, 3)],
      exchange: exchange(async (endpoint) => {
        attempts.push(endpoint.hostname);
        if (attempts.length === 1) throw new Error("offline");
        return packet();
      }),
      random: () => 0.75,
    });

    await expect(probe.query(friendly, signal())).resolves.toMatchObject({ name: "Hub" });
    expect(attempts).toEqual(["heavy.example", "light.example"]);
  });

  test("randomizes an all-zero weight group without replacement", async () => {
    const attempts: string[] = [];
    const rolls = [0.75, 0];
    const probe = createNodeMindustryProbe({
      resolveSrv: async () => [
        record("first.example", 0),
        record("second.example", 0),
        record("third.example", 0),
      ],
      exchange: exchange(async (endpoint) => {
        attempts.push(endpoint.hostname);
        throw new Error("offline");
      }),
      random: () => rolls.shift() ?? 0,
    });

    await expect(probe.query(friendly, signal())).rejects.toThrow();
    expect(attempts).toEqual(["third.example", "first.example", "second.example"]);
  });

  test("never queries the friendly host when usable SRV records exist", async () => {
    const attempts: string[] = [];
    const probe = createNodeMindustryProbe({
      resolveSrv: async () => [record("srv-one.example", 0), record("srv-two.example", 1)],
      exchange: exchange(async (endpoint) => {
        attempts.push(endpoint.hostname);
        throw new Error("offline");
      }),
    });

    await expect(probe.query(friendly, signal())).rejects.toThrow();
    expect(attempts).toEqual(["srv-one.example", "srv-two.example"]);
    expect(attempts).not.toContain(friendly);
  });

  test.each([
    ["an empty answer", async () => []],
    [
      "a DNS no-data result",
      async () => {
        throw Object.assign(new Error("no data"), { code: "ENODATA" });
      },
    ],
  ])("uses the friendly host only for %s", async (_label, resolveSrv) => {
    const query = vi.fn(async () => packet());
    const probe = createNodeMindustryProbe({ resolveSrv, exchange: exchange(query) });

    await probe.query(friendly, signal());

    expect(query).toHaveBeenCalledWith(
      { hostname: friendly, port: 6567 },
      expect.any(Uint8Array),
      expect.any(AbortSignal),
    );
  });

  test("does not use the friendly host when DNS explicitly says the service is unavailable", async () => {
    const query = vi.fn(async () => packet());
    const probe = createNodeMindustryProbe({
      resolveSrv: async () => [record(".", 0)],
      exchange: exchange(query),
    });

    await expect(probe.query(friendly, signal())).rejects.toThrow("status query failed");
    expect(query).not.toHaveBeenCalled();
  });

  test("does not use the friendly host for an authoritative answer with no usable targets", async () => {
    const query = vi.fn(async () => packet());
    const probe = createNodeMindustryProbe({
      resolveSrv: async () => [record("invalid.example", 0, 0, 0)],
      exchange: exchange(query),
    });

    await expect(probe.query(friendly, signal())).rejects.toThrow("status query failed");
    expect(query).not.toHaveBeenCalled();
  });

  test("retries another SRV target when a reply cannot be decoded", async () => {
    const query = vi
      .fn<EndpointExchange["query"]>()
      .mockResolvedValueOnce(Uint8Array.from([1, 2, 3]))
      .mockResolvedValueOnce(packet("Backup"));
    const probe = createNodeMindustryProbe({
      resolveSrv: async () => [record("bad.example", 0), record("good.example", 0)],
      exchange: exchange(query),
      random: () => 0,
    });

    await expect(probe.query(friendly, signal())).resolves.toMatchObject({ name: "Backup" });
    expect(query.mock.calls.map(([endpoint]) => endpoint.hostname)).toEqual([
      "bad.example",
      "good.example",
    ]);
  });

  test("aborting the caller aborts the active endpoint", async () => {
    const started = deferred<void>();
    let endpointSignal: AbortSignal | undefined;
    const probe = createNodeMindustryProbe({
      resolveSrv: async () => [],
      exchange: exchange((_endpoint, _packet, activeSignal) => {
        endpointSignal = activeSignal;
        started.resolve();
        return new Promise<Uint8Array>(() => {});
      }),
    });
    const controller = new AbortController();
    const result = probe.query(friendly, controller.signal);
    await started.promise;

    controller.abort();

    await expect(result).rejects.toMatchObject({ name: "AbortError" });
    expect(endpointSignal?.aborted).toBe(true);
  });

  test("closeAll aborts active work and closes the endpoint exchange", async () => {
    const started = deferred<void>();
    let endpointSignal: AbortSignal | undefined;
    const closeAll = vi.fn();
    const probe = createNodeMindustryProbe({
      resolveSrv: async () => [],
      exchange: exchange((_endpoint, _packet, activeSignal) => {
        endpointSignal = activeSignal;
        started.resolve();
        return new Promise<Uint8Array>(() => {});
      }, closeAll),
    });
    const result = probe.query(friendly, signal());
    await started.promise;

    probe.closeAll();

    await expect(result).rejects.toMatchObject({ name: "AbortError" });
    expect(endpointSignal?.aborted).toBe(true);
    expect(closeAll).toHaveBeenCalledOnce();
  });

  test("bounds DNS resolution with the total query timeout", async () => {
    vi.useFakeTimers();
    try {
      const probe = createNodeMindustryProbe({
        resolveSrv: () => new Promise(() => {}),
        exchange: exchange(async () => packet()),
        timeoutMs: 50,
      });
      const result = probe.query(friendly, signal());
      const rejected = expect(result).rejects.toThrow("status query timed out");

      await vi.advanceTimersByTimeAsync(50);

      await rejected;
    } finally {
      vi.useRealTimers();
    }
  });

  test("reports a safe failure category without resolved endpoint names", async () => {
    const probe = createNodeMindustryProbe({
      resolveSrv: async () => [record("private-target.example", 0)],
      exchange: exchange(async () => {
        throw Object.assign(new Error("connect private-target.example"), { code: "ECONNREFUSED" });
      }),
    });

    const result = probe.query(friendly, signal());

    await expect(result).rejects.toThrow("endpoint exchange ECONNREFUSED");
    await expect(result).rejects.not.toThrow("private-target.example");
  });
});
