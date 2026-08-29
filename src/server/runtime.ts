import type { ServerSnapshot } from "#app/data/snapshots";
import { StatusService, type PollHealth } from "#app/server/mindustry-status";
import { createNodeMindustryProbe, type NodeMindustryProbe } from "#app/server/node-transport";

export interface RuntimeHealth {
  status: "ok";
  uptimeSeconds: number;
  servers: PollHealth;
}

export class Runtime {
  readonly servers: StatusService;
  readonly #probe: NodeMindustryProbe;
  readonly #startedAt = Date.now();
  #stopped = false;

  constructor() {
    this.#probe = createNodeMindustryProbe();
    this.servers = new StatusService({
      probe: this.#probe,
      onError: (error) => report("servers", error),
    });
  }

  start(): void {
    this.servers.start();
  }

  stop(): void {
    if (this.#stopped) return;
    this.#stopped = true;
    this.servers.stop();
    this.#probe.closeAll();
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

export function getRuntime(): Runtime {
  runtime ??= new Runtime();
  return runtime;
}

export function stopRuntime(): void {
  runtime?.stop();
  runtime = null;
}

export function readServerSnapshot(): ServerSnapshot {
  return getRuntime().servers.snapshot;
}

function report(service: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[${service}] refresh failed: ${message}`);
}
