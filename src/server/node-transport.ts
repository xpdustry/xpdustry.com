/**
 * The real DNS and UDP boundary behind `StatusTransport`.
 *
 * Every path out of `query` closes the socket: reply, timeout, malformed
 * datagram, socket error, and shutdown. A leaked handle here would keep the
 * process alive past SIGTERM.
 */

import { createSocket, type Socket } from "node:dgram";
import { Resolver } from "node:dns/promises";
import { DEFAULT_MINDUSTRY_PORT, type StatusTransport } from "#app/server/mindustry-status";

/** Bound so one enormous datagram cannot be used to grow the heap. */
const MAX_REPLY_BYTES = 4096;

export interface NodeTransport extends StatusTransport {
  /** Shutdown hook: drops any socket still waiting for a reply. */
  closeAll: () => void;
}

export function createNodeTransport(): NodeTransport {
  const resolver = new Resolver({ timeout: 2000, tries: 2 });
  const open = new Set<Socket>();

  return {
    async query(host, port, packet, timeoutMs, signal) {
      try {
        return await queryEndpoint(host, port, packet, timeoutMs, signal, open);
      } catch (error) {
        if (port !== DEFAULT_MINDUSTRY_PORT || signal.aborted) throw error;

        const records = await resolver.resolveSrv(`_mindustry._tcp.${host}`);
        const target = pickSrvTarget(records);
        if (!target) throw error;
        return queryEndpoint(target.name, target.port, packet, timeoutMs, signal, open);
      }
    },

    closeAll() {
      for (const socket of open) {
        try {
          socket.close();
        } catch {
          // Nothing to do: the socket was already gone.
        }
      }
      open.clear();
    },
  };
}

function queryEndpoint(
  host: string,
  port: number,
  packet: Uint8Array,
  timeoutMs: number,
  signal: AbortSignal,
  open: Set<Socket>,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const socket = createSocket({ type: "udp4", reuseAddr: false });
    open.add(socket);

    let settled = false;
    const finish = (error: Error | null, reply?: Uint8Array) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      open.delete(socket);
      try {
        socket.close();
      } catch {
        // Already closed by whatever brought us here.
      }
      if (error) reject(error);
      else resolve(reply!);
    };

    const timer = setTimeout(
      () => finish(new Error(`no reply from ${host}:${port} within ${timeoutMs}ms`)),
      timeoutMs,
    );
    const onAbort = () => finish(new Error("status poll aborted"));

    if (signal.aborted) {
      finish(new Error("status poll aborted"));
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });

    socket.on("error", (error) => finish(error));
    socket.on("message", (message) => {
      if (message.byteLength > MAX_REPLY_BYTES) {
        finish(new Error(`reply from ${host}:${port} is ${message.byteLength} bytes`));
        return;
      }
      finish(null, new Uint8Array(message));
    });

    socket.send(packet, port, host, (error) => {
      if (error) finish(error);
    });
  });
}

function pickSrvTarget(records: Awaited<ReturnType<Resolver["resolveSrv"]>>) {
  const usable = records.filter(
    (record) =>
      record.name !== "" && record.name !== "." && record.port > 0 && record.port <= 65535,
  );
  return usable.sort((a, b) => a.priority - b.priority || b.weight - a.weight)[0];
}
