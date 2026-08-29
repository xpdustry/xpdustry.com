import { createSocket, type Socket } from "node:dgram";
import { Resolver } from "node:dns/promises";
import {
  decodeServerInfo,
  MalformedPacketError,
  QUERY_PACKET,
} from "#app/server/mindustry-protocol";
import type { MindustryStatusProbe } from "#app/server/mindustry-status";

export const DEFAULT_MINDUSTRY_PORT = 6567;
export const QUERY_TIMEOUT_MS = 5_000;
export const ENDPOINT_TIMEOUT_MS = 1_500;

const MAX_REPLY_BYTES = 4096;

export interface SrvRecord {
  name: string;
  port: number;
  priority: number;
  weight: number;
}

export interface Endpoint {
  hostname: string;
  port: number;
}

export interface EndpointExchange {
  query: (endpoint: Endpoint, packet: Uint8Array, signal: AbortSignal) => Promise<Uint8Array>;
  closeAll: () => void;
}

export interface NodeMindustryProbe extends MindustryStatusProbe {
  closeAll: () => void;
}

export interface NodeMindustryProbeOptions {
  resolveSrv?: (service: string) => Promise<readonly SrvRecord[]>;
  exchange?: EndpointExchange;
  random?: () => number;
  timeoutMs?: number;
  endpointTimeoutMs?: number;
}

type SrvResolution = { kind: "direct-fallback" } | { kind: "authoritative"; records: SrvRecord[] };

class ProbeFailure extends Error {}

export function createNodeMindustryProbe(
  options: NodeMindustryProbeOptions = {},
): NodeMindustryProbe {
  const resolver = new Resolver({ timeout: 2_000, tries: 2 });
  const resolveSrv = options.resolveSrv ?? ((service) => resolver.resolveSrv(service));
  const exchange = options.exchange ?? createUdpExchange();
  const random = options.random ?? Math.random;
  const timeoutMs = options.timeoutMs ?? QUERY_TIMEOUT_MS;
  const endpointTimeoutMs = options.endpointTimeoutMs ?? ENDPOINT_TIMEOUT_MS;
  const active = new Set<AbortController>();

  return {
    async query(hostname, signal) {
      const operation = new AbortController();
      active.add(operation);
      const stopForwarding = forwardAbort(signal, operation);
      let timedOut = false;
      const timeout = setTimeout(() => {
        timedOut = true;
        operation.abort();
      }, timeoutMs);

      try {
        const resolution = await resolveRecords(hostname, resolveSrv, operation.signal);
        const endpoints =
          resolution.kind === "direct-fallback"
            ? [{ hostname, port: DEFAULT_MINDUSTRY_PORT }]
            : orderSrvEndpoints(resolution.records, random);
        let lastFailure =
          resolution.kind === "authoritative" && endpoints.length === 0
            ? "no usable SRV endpoints"
            : "endpoint exchange failed";

        for (const endpoint of endpoints) {
          if (operation.signal.aborted) break;
          try {
            const packet = await attemptEndpoint(
              endpoint,
              exchange,
              endpointTimeoutMs,
              operation.signal,
            );
            return decodeServerInfo(packet);
          } catch (error) {
            if (operation.signal.aborted) break;
            lastFailure =
              error instanceof MalformedPacketError
                ? "malformed reply"
                : describeFailure("endpoint exchange", error);
          }
        }

        throw new ProbeFailure(lastFailure);
      } catch (error) {
        if (signal.aborted) throw abortError();
        if (operation.signal.aborted) {
          if (timedOut) throw new Error("Mindustry status query timed out", { cause: error });
          throw abortError();
        }
        const detail =
          error instanceof ProbeFailure ? error.message : describeFailure("SRV lookup", error);
        throw new Error(`Mindustry status query failed: ${detail}`, { cause: error });
      } finally {
        clearTimeout(timeout);
        stopForwarding();
        active.delete(operation);
      }
    },

    closeAll() {
      for (const controller of active) controller.abort();
      active.clear();
      resolver.cancel();
      exchange.closeAll();
    },
  };
}

function describeFailure(phase: string, error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    /^[A-Z0-9_]+$/.test(error.code)
  ) {
    return `${phase} ${error.code}`;
  }
  return `${phase} failed`;
}

async function resolveRecords(
  hostname: string,
  resolveSrv: (service: string) => Promise<readonly SrvRecord[]>,
  signal: AbortSignal,
): Promise<SrvResolution> {
  try {
    if (signal.aborted) throw abortError();
    const records = await withAbort(resolveSrv(`_mindustry._tcp.${hostname}`), signal);
    if (records.length === 0) return { kind: "direct-fallback" };
    return { kind: "authoritative", records: records.filter(isUsableSrvRecord) };
  } catch (error) {
    if (signal.aborted) throw error;
    if (isNoRecordsError(error)) return { kind: "direct-fallback" };
    throw error;
  }
}

function isUsableSrvRecord(record: SrvRecord): boolean {
  return (
    record.name !== "" &&
    record.name !== "." &&
    Number.isInteger(record.port) &&
    record.port > 0 &&
    record.port <= 65_535 &&
    Number.isInteger(record.priority) &&
    record.priority >= 0 &&
    record.priority <= 65_535 &&
    Number.isInteger(record.weight) &&
    record.weight >= 0 &&
    record.weight <= 65_535
  );
}

function isNoRecordsError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) return false;
  return error.code === "ENODATA" || error.code === "ENOTFOUND";
}

function orderSrvEndpoints(records: readonly SrvRecord[], random: () => number): Endpoint[] {
  const priorities = [...new Set(records.map((record) => record.priority))].sort((a, b) => a - b);
  return priorities.flatMap((priority) =>
    weightedOrder(
      records.filter((record) => record.priority === priority),
      random,
    ).map((record) => ({ hostname: record.name, port: record.port })),
  );
}

function weightedOrder(records: readonly SrvRecord[], random: () => number): SrvRecord[] {
  const remaining = [...records];
  const ordered: SrvRecord[] = [];

  while (remaining.length > 0) {
    const selectionOrder = [...remaining].sort((left, right) => {
      if (left.weight === 0 && right.weight !== 0) return -1;
      if (left.weight !== 0 && right.weight === 0) return 1;
      return 0;
    });
    const totalWeight = selectionOrder.reduce((sum, record) => sum + record.weight, 0);
    const value = random();
    const unit = Number.isFinite(value) ? Math.min(Math.max(value, 0), 1 - Number.EPSILON) : 0;
    const draw = Math.floor(unit * (totalWeight + 1));
    let runningWeight = 0;
    let selected =
      totalWeight === 0
        ? selectionOrder[Math.floor(unit * selectionOrder.length)]
        : selectionOrder[selectionOrder.length - 1];

    if (totalWeight !== 0) {
      for (const record of selectionOrder) {
        runningWeight += record.weight;
        if (runningWeight >= draw) {
          selected = record;
          break;
        }
      }
    }

    ordered.push(selected);
    remaining.splice(remaining.indexOf(selected), 1);
  }

  return ordered;
}

async function attemptEndpoint(
  endpoint: Endpoint,
  exchange: EndpointExchange,
  timeoutMs: number,
  parentSignal: AbortSignal,
): Promise<Uint8Array> {
  const attempt = new AbortController();
  const stopForwarding = forwardAbort(parentSignal, attempt);
  const timeout = setTimeout(() => attempt.abort(), timeoutMs);

  try {
    if (attempt.signal.aborted) throw abortError();
    return await withAbort(exchange.query(endpoint, QUERY_PACKET, attempt.signal), attempt.signal);
  } finally {
    clearTimeout(timeout);
    stopForwarding();
  }
}

function forwardAbort(source: AbortSignal, target: AbortController): () => void {
  const abort = () => target.abort();
  if (source.aborted) {
    abort();
    return () => {};
  }
  source.addEventListener("abort", abort, { once: true });
  return () => source.removeEventListener("abort", abort);
}

function withAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(abortError());

  return new Promise((resolve, reject) => {
    const aborted = () => {
      signal.removeEventListener("abort", aborted);
      reject(abortError());
    };
    signal.addEventListener("abort", aborted, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", aborted);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener("abort", aborted);
        reject(error);
      },
    );
  });
}

function abortError(): DOMException {
  return new DOMException("Status query aborted", "AbortError");
}

function createUdpExchange(): EndpointExchange {
  const open = new Set<Socket>();

  return {
    query(endpoint, packet, signal) {
      return new Promise((resolve, reject) => {
        const socket = createSocket({ type: "udp4", reuseAddr: false });
        open.add(socket);
        let settled = false;

        const cleanUp = () => {
          signal.removeEventListener("abort", onAbort);
          open.delete(socket);
          closeSocket(socket);
        };
        const fail = (error: Error) => {
          if (settled) return;
          settled = true;
          cleanUp();
          reject(error);
        };
        const succeed = (reply: Uint8Array) => {
          if (settled) return;
          settled = true;
          cleanUp();
          resolve(reply);
        };
        const onAbort = () => fail(abortError());

        if (signal.aborted) {
          onAbort();
          return;
        }

        signal.addEventListener("abort", onAbort, { once: true });
        socket.once("error", fail);
        socket.once("message", (message) => {
          if (message.byteLength > MAX_REPLY_BYTES) {
            fail(new Error("Mindustry reply exceeded the size limit"));
            return;
          }
          succeed(new Uint8Array(message));
        });
        try {
          socket.connect(endpoint.port, endpoint.hostname, () => {
            if (settled) return;
            try {
              socket.send(packet, (error) => {
                if (error) fail(error);
              });
            } catch (error) {
              fail(error instanceof Error ? error : new Error("UDP send failed"));
            }
          });
        } catch (error) {
          fail(error instanceof Error ? error : new Error("UDP connection failed"));
        }
      });
    },

    closeAll() {
      for (const socket of open) closeSocket(socket);
      open.clear();
    },
  };
}

function closeSocket(socket: Socket): void {
  try {
    socket.close();
  } catch {}
}
