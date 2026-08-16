/**
 * Polls the Mindustry servers over SRV + UDP and keeps one in-memory snapshot.
 *
 * Two rules shape this file:
 *
 * - A server that does not answer this cycle is offline in this snapshot.
 *   Carrying an old "online" forward would show players a server they cannot
 *   join, which is worse than showing nothing.
 * - The endpoint list is the one in `data/servers.ts`. Nothing here ever
 *   takes a hostname or port from an HTTP request.
 */

import { servers as defaultServers, type ServerDefinition } from "#app/data/servers";
import {
  EMPTY_SERVER_SNAPSHOT,
  type ServerSnapshot,
  type ServerSnapshotItem,
} from "#app/data/snapshots";
import { decodeServerInfo, QUERY_PACKET } from "#app/server/mindustry-protocol";
import { Poller, type PollerClock, type ServiceHealth } from "#app/server/poller";

export const SERVER_POLL_INTERVAL_MS = 30 * 1000;
export const QUERY_TIMEOUT_MS = 2000;

export const DEFAULT_MINDUSTRY_PORT = 6567;

/** The DNS and UDP seams, so tests never touch the network. */
export interface StatusTransport {
  query: (
    host: string,
    port: number,
    packet: Uint8Array,
    timeoutMs: number,
    signal: AbortSignal,
  ) => Promise<Uint8Array>;
}

export interface StatusServiceOptions {
  transport: StatusTransport;
  servers?: readonly ServerDefinition[];
  now?: () => Date;
  monotonic?: () => number;
  clock?: PollerClock;
  intervalMs?: number;
  onError?: (error: unknown) => void;
}

export class StatusService {
  #options: StatusServiceOptions;
  #now: () => Date;
  #monotonic: () => number;
  #poller: Poller;
  #snapshot: ServerSnapshot = EMPTY_SERVER_SNAPSHOT;
  #lastAttemptAt: string | null = null;
  #lastSuccessAt: string | null = null;

  constructor(options: StatusServiceOptions) {
    this.#options = options;
    this.#now = options.now ?? (() => new Date());
    this.#monotonic = options.monotonic ?? (() => performance.now());
    this.#poller = new Poller({
      intervalMs: options.intervalMs ?? SERVER_POLL_INTERVAL_MS,
      run: (signal) => this.refresh(signal),
      onError: options.onError,
      clock: options.clock,
    });
  }

  start(): void {
    this.#poller.start();
  }

  stop(): void {
    this.#poller.stop();
  }

  get snapshot(): ServerSnapshot {
    return this.#snapshot;
  }

  get health(): ServiceHealth {
    return {
      state: this.#snapshot.state,
      lastAttemptAt: this.#lastAttemptAt,
      lastSuccessAt: this.#lastSuccessAt,
    };
  }

  /** Queries every server concurrently. Always resolves. */
  async refresh(signal?: AbortSignal): Promise<void> {
    const definitions = this.#options.servers ?? defaultServers;
    const polledAt = this.#now().toISOString();
    this.#lastAttemptAt = polledAt;

    const results = await Promise.allSettled(
      definitions.map((server) => this.#queryOne(server, signal)),
    );

    // An aborted cycle must not overwrite the snapshot with a row of offline
    // servers on the way out.
    if (signal?.aborted) return;

    const items: ServerSnapshotItem[] = definitions.map((server, index) => {
      const result = results[index];
      if (result.status === "fulfilled") return { ...result.value, polledAt };
      this.#options.onError?.(result.reason);
      return {
        slug: server.slug,
        label: server.label,
        hostname: server.hostname,
        online: false,
        polledAt,
      };
    });

    this.#snapshot = { state: "ready", updatedAt: polledAt, servers: items };
    this.#lastSuccessAt = polledAt;
  }

  async #queryOne(
    server: ServerDefinition,
    signal?: AbortSignal,
  ): Promise<Omit<ServerSnapshotItem, "polledAt">> {
    const startedAt = this.#monotonic();
    const packet = await this.#options.transport.query(
      server.hostname,
      DEFAULT_MINDUSTRY_PORT,
      QUERY_PACKET,
      QUERY_TIMEOUT_MS,
      signal ?? new AbortController().signal,
    );
    const pingMs = Math.round(this.#monotonic() - startedAt);

    return {
      slug: server.slug,
      label: server.label,
      hostname: server.hostname,
      online: true,
      pingMs,
      info: decodeServerInfo(packet),
    };
  }
}
