import { afterEach, describe, expect, test, vi } from "vitest";
import { serverInfoPacket } from "#tests/support/mindustryPacket";
import type { Endpoint, SrvRecord } from "./srv";
import { createNodeMindustryProbe, type EndpointExchange } from "./transport";

const HOST = "hub.md.xpdustry.com";
const SERVICE = "_mindustry._tcp.hub.md.xpdustry.com";
const GAME_REPLY_WAIT_MS = 2_000;

const packet = (name = "Hub") => serverInfoPacket({ name });

function record(name: string, priority: number, weight = 0, port = 6567): SrvRecord {
  return { name, priority, weight, port };
}

type Behaviour = Uint8Array | "silent" | { replyAfterMs: number; reply: Uint8Array };

const isDiscoverHost = (sent: Uint8Array) =>
  sent.length === 2 && sent[0] === 0xfe && sent[1] === 0x01;

const silentUntilAborted = (signal: AbortSignal) =>
  new Promise<Uint8Array>((_, reject) => {
    signal.addEventListener("abort", () => reject(signal.reason), { once: true });
  });

const replyAfter = (ms: number, reply: Uint8Array) =>
  new Promise<Uint8Array>((resolve) => setTimeout(() => resolve(reply), ms));

function network(endpoints: Record<string, Behaviour>, closeAll = () => {}) {
  const asked: string[] = [];
  const exchange: EndpointExchange = {
    async query({ hostname, port }: Endpoint, sent, signal) {
      const at = `${hostname}:${port}`;
      asked.push(at);
      if (!isDiscoverHost(sent)) return silentUntilAborted(signal);
      const behaviour = endpoints[at];
      if (behaviour === undefined) {
        throw Object.assign(new Error(`getaddrinfo ENOTFOUND ${hostname}`), { code: "ENOTFOUND" });
      }
      if (behaviour === "silent") return silentUntilAborted(signal);
      if (behaviour instanceof Uint8Array) return behaviour;
      return replyAfter(behaviour.replyAfterMs, behaviour.reply);
    },
    closeAll
  };
  return { exchange, asked };
}

function dns(records: SrvRecord[] | Error, answerAfterMs = 0) {
  const lookups: string[] = [];
  const resolveSrv = async (service: string) => {
    lookups.push(service);
    if (answerAfterMs > 0) await new Promise((resolve) => setTimeout(resolve, answerAfterMs));
    if (records instanceof Error) throw records;
    if (service !== SERVICE) throw Object.assign(new Error(service), { code: "ENOTFOUND" });
    return records;
  };
  return { resolveSrv, lookups };
}

const dnsError = (code: string) => Object.assign(new Error(code), { code });

const signal = () => new AbortController().signal;

afterEach(() => {
  vi.useRealTimers();
});

describe("reaching a server the way the game does", () => {
  test("asks the address as given on port 6567, and looks up no SRV when it answers", async () => {
    const { exchange, asked } = network({ [`${HOST}:6567`]: packet("Direct") });
    const { resolveSrv, lookups } = dns([record("srv.example", 0)]);

    const info = await createNodeMindustryProbe({ exchange, resolveSrv }).query(HOST, signal());

    expect(info.name).toBe("Direct");
    expect(asked).toEqual([`${HOST}:6567`]);
    expect(lookups).toEqual([]);
  });

  test("asks with the two bytes of DiscoverHost", async () => {
    const query = vi.fn<EndpointExchange["query"]>(async () => packet());
    const probe = createNodeMindustryProbe({
      exchange: { query, closeAll: () => {} },
      resolveSrv: dns([]).resolveSrv
    });

    await probe.query(HOST, signal());

    expect(query).toHaveBeenCalledExactlyOnceWith(
      { hostname: HOST, port: 6567 },
      Uint8Array.from([0xfe, 0x01]),
      expect.any(AbortSignal)
    );
  });

  test("falls back to _mindustry._tcp.<address> only once the address fails to answer", async () => {
    const { exchange, asked } = network({ "srv.example:7000": packet("Through SRV") });
    const { resolveSrv, lookups } = dns([record("srv.example", 0, 0, 7000)]);

    const info = await createNodeMindustryProbe({ exchange, resolveSrv }).query(HOST, signal());

    expect(info.name).toBe("Through SRV");
    expect(lookups).toEqual([SERVICE]);
    expect(asked).toEqual([`${HOST}:6567`, "srv.example:7000"]);
  });

  test("waits the game's 2 seconds for the address before looking up SRV", async () => {
    vi.useFakeTimers();
    const { exchange } = network({ [`${HOST}:6567`]: "silent", "srv.example:6567": packet() });
    const { resolveSrv, lookups } = dns([record("srv.example", 0)]);
    const result = createNodeMindustryProbe({ exchange, resolveSrv }).query(HOST, signal());

    await vi.advanceTimersByTimeAsync(GAME_REPLY_WAIT_MS - 1);
    expect(lookups).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);

    await expect(result).resolves.toMatchObject({ name: "Hub" });
    expect(lookups).toEqual([SERVICE]);
  });

  test("tries targets by ascending priority, then ascending weight, keeping the answer's order on ties", async () => {
    const { exchange, asked } = network({});
    const { resolveSrv } = dns([
      record("later.example", 1, 0),
      record("heavy.example", 0, 50),
      record("light.example", 0, 10),
      record("tied-first.example", 0, 30),
      record("tied-second.example", 0, 30)
    ]);

    await expect(
      createNodeMindustryProbe({ exchange, resolveSrv }).query(HOST, signal())
    ).rejects.toThrow("status query failed");

    expect(asked).toEqual([
      `${HOST}:6567`,
      "light.example:6567",
      "tied-first.example:6567",
      "tied-second.example:6567",
      "heavy.example:6567",
      "later.example:6567"
    ]);
  });

  test("finds a server through its second target in the game's longest ordinary sequence", async () => {
    vi.useFakeTimers();
    const almost = GAME_REPLY_WAIT_MS - 100;
    const { exchange } = network({
      [`${HOST}:6567`]: "silent",
      "first.example:6567": "silent",
      "second.example:6567": { replyAfterMs: almost, reply: packet("Second") }
    });
    const { resolveSrv } = dns([record("first.example", 0), record("second.example", 1)], almost);
    const result = createNodeMindustryProbe({ exchange, resolveSrv }).query(HOST, signal());

    await vi.advanceTimersByTimeAsync(4 * GAME_REPLY_WAIT_MS);

    await expect(result).resolves.toMatchObject({ name: "Second" });
  });

  test.each([
    ["a malformed reply from the address", { [`${HOST}:6567`]: Uint8Array.from([1, 2, 3]) }],
    [
      "a malformed reply from a target",
      { "bad.example:6567": Uint8Array.from([1, 2, 3]), "good.example:6567": packet() }
    ]
  ])("stops at %s, as the game's reader throws past its fallback", async (_label, endpoints) => {
    const { exchange, asked } = network(endpoints);
    const { resolveSrv } = dns([record("bad.example", 0), record("good.example", 1)]);

    await expect(
      createNodeMindustryProbe({ exchange, resolveSrv }).query(HOST, signal())
    ).rejects.toThrow("status query failed: malformed reply");

    expect(asked).not.toContain("good.example:6567");
  });

  test.each([
    ["no records", dns([])],
    ["a lookup that fails", dns(dnsError("ESERVFAIL"))],
    ["a name with no SRV", dns(dnsError("ENODATA"))]
  ])("reports the address's own failure after %s", async (_label, { resolveSrv }) => {
    const { exchange } = network({});

    await expect(
      createNodeMindustryProbe({ exchange, resolveSrv }).query(HOST, signal())
    ).rejects.toThrow("Mindustry status query failed: endpoint exchange ENOTFOUND");
  });

  test("gives up at the check's deadline when nothing answers", async () => {
    vi.useFakeTimers();
    const { exchange } = network({
      [`${HOST}:6567`]: "silent",
      "a.example:6567": "silent",
      "b.example:6567": "silent",
      "c.example:6567": "silent"
    });
    const { resolveSrv } = dns([
      record("a.example", 0),
      record("b.example", 0),
      record("c.example", 0)
    ]);
    const result = createNodeMindustryProbe({ exchange, resolveSrv }).query(HOST, signal());
    const rejected = expect(result).rejects.toThrow("status query timed out");

    await vi.advanceTimersByTimeAsync(4 * GAME_REPLY_WAIT_MS);

    await rejected;
  });

  test.each([
    ["an empty target", record("", 0)],
    ["the root target", record(".", 0)],
    ["port 0", record("srv.example", 0, 0, 0)],
    ["a port above 65535", record("srv.example", 0, 0, 65_536)],
    ["a fractional priority", record("srv.example", 0.5)],
    ["a negative weight", record("srv.example", 0, -1)]
  ])("skips an SRV record with %s", async (_label, refused) => {
    const { exchange, asked } = network({});
    const { resolveSrv } = dns([refused]);

    await expect(
      createNodeMindustryProbe({ exchange, resolveSrv }).query(HOST, signal())
    ).rejects.toThrow("status query failed");

    expect(asked).toEqual([`${HOST}:6567`]);
  });

  test("reports a failure by its code, without the names it resolved", async () => {
    const exchange: EndpointExchange = {
      query: async () => {
        throw Object.assign(new Error("connect private-target.example"), { code: "ECONNREFUSED" });
      },
      closeAll: () => {}
    };
    const { resolveSrv } = dns([record("private-target.example", 0)]);

    const result = createNodeMindustryProbe({ exchange, resolveSrv }).query(HOST, signal());

    await expect(result).rejects.toThrow("endpoint exchange ECONNREFUSED");
    await expect(result).rejects.not.toThrow("private-target.example");
  });

  test("aborting the caller aborts the attempt in flight", async () => {
    const started = Promise.withResolvers<AbortSignal>();
    const exchange: EndpointExchange = {
      query: (_endpoint, _sent, attempt) => {
        started.resolve(attempt);
        return silentUntilAborted(attempt);
      },
      closeAll: () => {}
    };
    const caller = new AbortController();
    const result = createNodeMindustryProbe({ exchange, resolveSrv: dns([]).resolveSrv }).query(
      HOST,
      caller.signal
    );
    const attempt = await started.promise;

    caller.abort();

    await expect(result).rejects.toMatchObject({ name: "AbortError" });
    expect(attempt.aborted).toBe(true);
  });

  test("closeAll aborts work in flight and closes the exchange", async () => {
    const started = Promise.withResolvers<AbortSignal>();
    const closeAll = vi.fn();
    const exchange: EndpointExchange = {
      query: (_endpoint, _sent, attempt) => {
        started.resolve(attempt);
        return silentUntilAborted(attempt);
      },
      closeAll
    };
    const probe = createNodeMindustryProbe({ exchange, resolveSrv: dns([]).resolveSrv });
    const result = probe.query(HOST, signal());
    const attempt = await started.promise;

    probe.closeAll();

    await expect(result).rejects.toMatchObject({ name: "AbortError" });
    expect(attempt.aborted).toBe(true);
    expect(closeAll).toHaveBeenCalledOnce();
  });

  test("does nothing for a caller that already gave up", async () => {
    const query = vi.fn(async () => packet());
    const { resolveSrv, lookups } = dns([]);
    const probe = createNodeMindustryProbe({ exchange: { query, closeAll: () => {} }, resolveSrv });

    await expect(probe.query(HOST, AbortSignal.abort())).rejects.toMatchObject({
      name: "AbortError"
    });
    expect(query).not.toHaveBeenCalled();
    expect(lookups).toEqual([]);
  });
});
