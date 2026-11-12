// The background work behind the live parts of the site: Mindustry server status every 30 s,
// Discord counts every 5 min and GitHub every hour. Pages read the latest results and never wait.

import type { DiscordCounts, LiveData } from "#app/data/live";
import { SITE } from "#app/data/site";
import type { ServerSnapshot } from "#app/data/snapshots";
import { fetchDiscordCounts } from "#app/server/discord";
import { fetchGitHubStats, type GitHubStats } from "#app/server/github";
import { StatusService } from "#app/server/mindustry/status";
import type { PollHealth } from "#app/server/mindustry/status";
import { createNodeMindustryProbe } from "#app/server/mindustry/transport";
import { Poller, type PollerHealth } from "#app/server/poller";

export interface ServicesHealth {
  status: "ok";
  uptimeSeconds: number;
  servers: PollHealth;
  discord: PollerHealth;
  github: PollerHealth;
}

export class Services {
  readonly #probe = createNodeMindustryProbe();
  readonly #startedAt = Date.now();
  readonly status = new StatusService({
    probe: this.#probe,
    onError: (error) =>
      console.warn(`[servers] refresh failed: ${error instanceof Error ? error.message : error}`),
  });
  readonly discord = new Poller<DiscordCounts>({
    name: "discord",
    intervalMs: 5 * 60_000,
    load: (signal) => fetchDiscordCounts(SITE.discordInvite, signal),
  });
  readonly github = new Poller<GitHubStats>({
    name: "github",
    intervalMs: 60 * 60_000,
    load: (signal) => fetchGitHubStats(signal),
  });

  start(): void {
    this.status.start();
    this.discord.start();
    this.github.start();
  }

  stop(): void {
    this.status.stop();
    this.discord.stop();
    this.github.stop();
    this.#probe.closeAll();
  }

  get servers(): ServerSnapshot {
    return this.status.snapshot;
  }

  get live(): LiveData {
    return {
      servers: this.status.snapshot,
      discord: this.discord.value,
      releases: this.github.value?.releases ?? {},
    };
  }

  get health(): ServicesHealth {
    return {
      status: "ok",
      uptimeSeconds: Math.round((Date.now() - this.#startedAt) / 1000),
      servers: this.status.health,
      discord: this.discord.health,
      github: this.github.health,
    };
  }
}

// One instance per process, kept on globalThis so a hot reload of this module in development
// reuses the running services instead of starting a second set of pollers.
const KEY = Symbol.for("xpdustry.services");
const registry = globalThis as typeof globalThis & { [KEY]?: Services };

export function services(): Services {
  return (registry[KEY] ??= new Services());
}

/** Starts polling unless `XPD_DISABLE_STATUS=1`, as the tests set. */
export function startServices(): Services {
  const instance = services();
  if (process.env.XPD_DISABLE_STATUS !== "1") instance.start();
  return instance;
}
