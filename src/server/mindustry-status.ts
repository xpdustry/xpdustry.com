import { servers as defaultServers, type ServerDefinition } from "#app/data/servers";
import {
  createServerSnapshot,
  type OnlineServerSnapshotItem,
  type ServerInfo,
  type ServerSnapshot,
  type ServerSnapshotItem,
} from "#app/data/snapshots";

export const SERVER_POLL_INTERVAL_MS = 30_000;

export interface MindustryStatusProbe {
  query: (hostname: string, signal: AbortSignal) => Promise<ServerInfo>;
}

export interface ScheduledTask {
  cancel: () => void;
}

export interface StatusClock {
  schedule: (handler: () => void, delayMs: number) => ScheduledTask;
}

const systemClock: StatusClock = {
  schedule(handler, delayMs) {
    const timer = setTimeout(handler, delayMs);
    return { cancel: () => clearTimeout(timer) };
  },
};

export interface PollHealth {
  lastAttemptAt: string | null;
  lastCompletedAt: string | null;
}

export interface StatusServiceOptions {
  probe: MindustryStatusProbe;
  servers?: readonly ServerDefinition[];
  now?: () => Date;
  clock?: StatusClock;
  intervalMs?: number;
  onError?: (error: unknown) => void;
}

export class StatusService {
  readonly #options: StatusServiceOptions;
  readonly #definitions: readonly ServerDefinition[];
  readonly #now: () => Date;
  readonly #clock: StatusClock;
  readonly #intervalMs: number;
  #snapshot: ServerSnapshot;
  #lastAttemptAt: string | null = null;
  #lastCompletedAt: string | null = null;
  #started = false;
  #generation = 0;
  #scheduled: ScheduledTask | null = null;
  #controller: AbortController | null = null;

  constructor(options: StatusServiceOptions) {
    this.#options = options;
    this.#definitions = options.servers ?? defaultServers;
    this.#now = options.now ?? (() => new Date());
    this.#clock = options.clock ?? systemClock;
    this.#intervalMs = options.intervalMs ?? SERVER_POLL_INTERVAL_MS;
    this.#snapshot = createServerSnapshot(this.#definitions, "polling");
  }

  get started(): boolean {
    return this.#started;
  }

  get snapshot(): ServerSnapshot {
    return this.#snapshot;
  }

  get health(): PollHealth {
    return {
      lastAttemptAt: this.#lastAttemptAt,
      lastCompletedAt: this.#lastCompletedAt,
    };
  }

  start(): void {
    if (this.#started) return;
    this.#started = true;
    const generation = ++this.#generation;
    void this.#cycle(generation);
  }

  stop(): void {
    if (!this.#started) return;
    this.#started = false;
    this.#generation += 1;
    this.#scheduled?.cancel();
    this.#scheduled = null;
    this.#controller?.abort();
    this.#controller = null;
  }

  async refresh(signal?: AbortSignal): Promise<void> {
    this.#lastAttemptAt = this.#now().toISOString();
    const activeSignal = signal ?? new AbortController().signal;
    const results = await Promise.allSettled(
      this.#definitions.map((server) => this.#queryOne(server, activeSignal)),
    );

    if (activeSignal.aborted) return;

    const items = this.#definitions.map<ServerSnapshotItem>((server, index) => {
      const result = results[index];
      if (result.status === "fulfilled") return result.value;
      return {
        slug: server.slug,
        label: server.label,
        hostname: server.hostname,
        status: "offline",
      };
    });

    this.#snapshot = { servers: items };
    this.#lastCompletedAt = this.#now().toISOString();
  }

  async #cycle(generation: number): Promise<void> {
    const controller = new AbortController();
    this.#controller = controller;

    try {
      await this.refresh(controller.signal);
    } catch (error) {
      if (this.#started && generation === this.#generation) this.#reportSafely(error);
    }

    if (!this.#started || generation !== this.#generation || this.#controller !== controller) {
      return;
    }

    this.#controller = null;
    this.#scheduled = this.#clock.schedule(() => {
      this.#scheduled = null;
      void this.#cycle(generation);
    }, this.#intervalMs);
  }

  async #queryOne(
    server: ServerDefinition,
    signal: AbortSignal,
  ): Promise<OnlineServerSnapshotItem> {
    const info = await this.#options.probe.query(server.hostname, signal);

    return {
      slug: server.slug,
      label: server.label,
      hostname: server.hostname,
      status: "online",
      info,
    };
  }

  #reportSafely(error: unknown): void {
    try {
      this.#options.onError?.(error);
    } catch {}
  }
}
