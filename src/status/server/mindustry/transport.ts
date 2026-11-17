import { createSocket, type Socket } from "node:dgram";
import { Resolver } from "node:dns/promises";
import type { ServerInfo } from "../../snapshots";
import { decodeServerInfo, MalformedPacketError, QUERY_PACKET } from "./protocol";
import { inTheGamesOrder, isUsableSrvRecord, type Endpoint, type SrvRecord } from "./srv";
import type { MindustryStatusProbe } from "./status";

const DEFAULT_MINDUSTRY_PORT = 6567;
const GAME_REPLY_WAIT_MS = 2_000;
const CHECK_DEADLINE_MS = 4 * GAME_REPLY_WAIT_MS;

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
}

type Ask = (endpoint: Endpoint) => Promise<ServerInfo>;

export function createNodeMindustryProbe(
  options: NodeMindustryProbeOptions = {}
): NodeMindustryProbe {
  const resolver = new Resolver({ timeout: GAME_REPLY_WAIT_MS, tries: 1 });
  const resolveSrv = options.resolveSrv ?? ((service) => resolver.resolveSrv(service));
  const exchange = options.exchange ?? createUdpExchange();
  const active = new Set<AbortController>();

  return {
    async query(hostname, signal) {
      const check = deadline(signal, CHECK_DEADLINE_MS);
      active.add(check.controller);
      const ask: Ask = async (endpoint) =>
        decodeServerInfo(await attemptEndpoint(endpoint, exchange, check.signal));
      try {
        return await reachLikeTheGame(hostname, ask, resolveSrv, check.signal);
      } catch (error) {
        throw queryError(error, signal, check);
      } finally {
        check.release();
        active.delete(check.controller);
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

const failedToReceive = (error: unknown, signal: AbortSignal) =>
  !signal.aborted && !(error instanceof MalformedPacketError);

async function reachLikeTheGame(
  hostname: string,
  ask: Ask,
  resolveSrv: (service: string) => Promise<readonly SrvRecord[]>,
  signal: AbortSignal
): Promise<ServerInfo> {
  if (signal.aborted) throw abortError();
  let directFailure: unknown;
  try {
    return await ask({ hostname, port: DEFAULT_MINDUSTRY_PORT });
  } catch (error) {
    if (!failedToReceive(error, signal)) throw error;
    directFailure = error;
  }
  for (const endpoint of await srvTargets(hostname, resolveSrv, signal)) {
    try {
      return await ask(endpoint);
    } catch (error) {
      if (!failedToReceive(error, signal)) throw error;
    }
  }
  throw directFailure;
}

async function srvTargets(
  hostname: string,
  resolveSrv: (service: string) => Promise<readonly SrvRecord[]>,
  signal: AbortSignal
): Promise<Endpoint[]> {
  try {
    const records = await withAbort(resolveSrv(`_mindustry._tcp.${hostname}`), signal);
    return inTheGamesOrder(records.filter(isUsableSrvRecord));
  } catch (error) {
    if (signal.aborted) throw error;
    return [];
  }
}

interface Deadline {
  controller: AbortController;
  signal: AbortSignal;
  timedOut: () => boolean;
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

function queryError(error: unknown, caller: AbortSignal, check: Deadline): Error {
  if (caller.aborted) return abortError();
  if (check.timedOut()) return new Error("Mindustry status query timed out", { cause: error });
  if (check.signal.aborted) return abortError();
  const detail =
    error instanceof MalformedPacketError
      ? "malformed reply"
      : describeFailure("endpoint exchange", error);
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

async function attemptEndpoint(
  endpoint: Endpoint,
  exchange: EndpointExchange,
  parentSignal: AbortSignal
): Promise<Uint8Array> {
  const attempt = deadline(parentSignal, GAME_REPLY_WAIT_MS);
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
