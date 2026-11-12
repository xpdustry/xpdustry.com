import { createSocket, type Socket } from "node:dgram";
import { Resolver } from "node:dns/promises";
import type { ServerInfo } from "../../snapshots";
import { decodeServerInfo, MalformedPacketError, QUERY_PACKET } from "./protocol";
import { isUsableSrvRecord, orderSrvEndpoints, type Endpoint, type SrvRecord } from "./srv";
import type { MindustryStatusProbe } from "./status";

const DEFAULT_MINDUSTRY_PORT = 6567;
const QUERY_TIMEOUT_MS = 5_000;
const ENDPOINT_TIMEOUT_MS = 1_500;

const MAX_REPLY_BYTES = 4096;

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

/** A failure whose message is safe to report: a category, never a resolved name. */
class ProbeFailure extends Error {}

export function createNodeMindustryProbe(
  options: NodeMindustryProbeOptions = {}
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
      const operation = deadline(signal, timeoutMs);
      active.add(operation.controller);
      try {
        const endpoints = await findEndpoints(hostname, resolveSrv, random, operation.signal);
        return await firstServerInfo(
          endpoints,
          (endpoint) => attemptEndpoint(endpoint, exchange, endpointTimeoutMs, operation.signal),
          operation.signal
        );
      } catch (error) {
        throw queryError(error, signal, operation);
      } finally {
        operation.release();
        active.delete(operation.controller);
      }
    },

    closeAll() {
      for (const controller of active) controller.abort();
      active.clear();
      resolver.cancel();
      exchange.closeAll();
    }
  };
}

/** An abort controller that follows `parent` and gives up by itself after `timeoutMs`. */
interface Deadline {
  controller: AbortController;
  signal: AbortSignal;
  timedOut: () => boolean;
  /** Stops the timer and the following, once the work is over. */
  release: () => void;
}

function deadline(parent: AbortSignal, timeoutMs: number): Deadline {
  const controller = new AbortController();
  const stopForwarding = forwardAbort(parent, controller);
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  return {
    controller,
    signal: controller.signal,
    timedOut: () => timedOut,
    release() {
      clearTimeout(timer);
      stopForwarding();
    }
  };
}

/** Where to ask: the SRV targets in their order, or the host itself when it publishes none. */
async function findEndpoints(
  hostname: string,
  resolveSrv: (service: string) => Promise<readonly SrvRecord[]>,
  random: () => number,
  signal: AbortSignal
): Promise<Endpoint[]> {
  const resolution = await resolveRecords(hostname, resolveSrv, signal);
  if (resolution.kind === "direct-fallback") return [{ hostname, port: DEFAULT_MINDUSTRY_PORT }];
  return orderSrvEndpoints(resolution.records, random);
}

/** Asks each endpoint in turn and decodes the first reply, until one answers or time runs out. */
async function firstServerInfo(
  endpoints: readonly Endpoint[],
  ask: (endpoint: Endpoint) => Promise<Uint8Array>,
  signal: AbortSignal
): Promise<ServerInfo> {
  if (endpoints.length === 0) throw new ProbeFailure("no usable SRV endpoints");
  let lastFailure = "endpoint exchange failed";
  for (const endpoint of endpoints) {
    if (signal.aborted) break;
    try {
      return decodeServerInfo(await ask(endpoint));
    } catch (error) {
      if (signal.aborted) break;
      lastFailure =
        error instanceof MalformedPacketError
          ? "malformed reply"
          : describeFailure("endpoint exchange", error);
    }
  }
  throw new ProbeFailure(lastFailure);
}

/** An abort for a caller that gave up, else a timeout or the category of what went wrong. */
function queryError(error: unknown, caller: AbortSignal, operation: Deadline): Error {
  if (caller.aborted) return abortError();
  if (operation.timedOut()) return new Error("Mindustry status query timed out", { cause: error });
  if (operation.signal.aborted) return abortError();
  const detail =
    error instanceof ProbeFailure ? error.message : describeFailure("SRV lookup", error);
  return new Error(`Mindustry status query failed: ${detail}`, { cause: error });
}

function errorCode(error: unknown): unknown {
  return typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
}

function describeFailure(phase: string, error: unknown): string {
  const code = errorCode(error);
  return typeof code === "string" && /^[A-Z0-9_]+$/.test(code)
    ? `${phase} ${code}`
    : `${phase} failed`;
}

async function resolveRecords(
  hostname: string,
  resolveSrv: (service: string) => Promise<readonly SrvRecord[]>,
  signal: AbortSignal
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

function isNoRecordsError(error: unknown): boolean {
  const code = errorCode(error);
  return code === "ENODATA" || code === "ENOTFOUND";
}

async function attemptEndpoint(
  endpoint: Endpoint,
  exchange: EndpointExchange,
  timeoutMs: number,
  parentSignal: AbortSignal
): Promise<Uint8Array> {
  const attempt = deadline(parentSignal, timeoutMs);
  try {
    if (attempt.signal.aborted) throw abortError();
    return await withAbort(exchange.query(endpoint, QUERY_PACKET, attempt.signal), attempt.signal);
  } finally {
    attempt.release();
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
      }
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
      const socket = createSocket({ type: "udp4", reuseAddr: false });
      open.add(socket);
      return exchangeDatagram(socket, endpoint, packet, signal, () => {
        open.delete(socket);
        closeSocket(socket);
      });
    },

    closeAll() {
      for (const socket of open) closeSocket(socket);
      open.clear();
    }
  };
}

/**
 * Sends `packet` to `endpoint` and settles once: with the first reply, an error or an abort,
 * whichever comes first. `release` runs as it settles.
 */
function exchangeDatagram(
  socket: Socket,
  endpoint: Endpoint,
  packet: Uint8Array,
  signal: AbortSignal,
  release: () => void
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (outcome: () => void) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      release();
      outcome();
    };
    const fail = (error: Error) => settle(() => reject(error));
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
      settle(() => resolve(new Uint8Array(message)));
    });
    try {
      socket.connect(endpoint.port, endpoint.hostname, () => {
        if (!settled) send(socket, packet, fail);
      });
    } catch (error) {
      fail(asError(error, "UDP connection failed"));
    }
  });
}

function send(socket: Socket, packet: Uint8Array, fail: (error: Error) => void): void {
  try {
    socket.send(packet, (error) => {
      if (error) fail(error);
    });
  } catch (error) {
    fail(asError(error, "UDP send failed"));
  }
}

function asError(error: unknown, fallback: string): Error {
  return error instanceof Error ? error : new Error(fallback);
}

function closeSocket(socket: Socket): void {
  try {
    socket.close();
  } catch {}
}
