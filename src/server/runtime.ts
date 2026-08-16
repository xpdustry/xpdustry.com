/**
 * The one place the poller is created, started and stopped.
 *
 * The status service is a process-wide singleton. Route modules and the
 * renderer read its snapshot; nothing else starts a poll cycle, and none of
 * this module ever reaches a client bundle.
 */

import type { ServerSnapshot } from "#app/data/snapshots";
import { StatusService } from "#app/server/mindustry-status";
import { createNodeTransport, type NodeTransport } from "#app/server/node-transport";

export interface RuntimeConfig {
  port: number;
}

/**
 * What `/healthz` is allowed to say. No secrets, no resolved SRV targets, no
 * stack traces: a monitor needs to know the process is alive and whether the
 * poller is landing, and nothing more.
 */
export interface ServiceReport {
  state: "loading" | "ready" | "unavailable";
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
}

export interface RuntimeHealth {
  status: "ok";
  uptimeSeconds: number;
  servers: ServiceReport;
}

export class Runtime {
  readonly servers: StatusService;
  readonly #transport: NodeTransport;
  readonly #startedAt = Date.now();
  #stopped = false;

  constructor() {
    this.#transport = createNodeTransport();
    this.servers = new StatusService({
      transport: this.#transport,
      onError: (error) => report("servers", error),
    });
  }

  start(): void {
    this.servers.start();
  }

  /** Clears timers, aborts in-flight polls, closes UDP sockets. */
  stop(): void {
    if (this.#stopped) return;
    this.#stopped = true;
    this.servers.stop();
    this.#transport.closeAll();
  }

  health(): RuntimeHealth {
    return {
      status: "ok",
      uptimeSeconds: Math.round((Date.now() - this.#startedAt) / 1000),
      servers: this.servers.health,
    };
  }
}

let runtime: Runtime | null = null;

export function readConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const raw = env.PORT ?? "3000";
  const port = Number.parseInt(raw, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be a number between 1 and 65535, got ${JSON.stringify(raw)}`);
  }
  return { port };
}

/**
 * The singleton. `node.ts` calls this once before it listens; in development
 * the first rendered request creates it, because there is no authored entry
 * on that path.
 */
export function getRuntime(): Runtime {
  if (!runtime) {
    runtime = new Runtime();
    runtime.start();
  }
  return runtime;
}

export function stopRuntime(): void {
  runtime?.stop();
  runtime = null;
}

export function readServerSnapshot(): ServerSnapshot {
  return getRuntime().servers.snapshot;
}

/**
 * Poller failures are expected weather, not incidents: one line and no stack,
 * so a restarting game server does not bury the log.
 */
function report(service: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[${service}] poll failed: ${message}`);
}
