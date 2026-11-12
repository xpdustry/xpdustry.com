import type { DiscordCounts, LiveData } from "#app/data/live";
import { servers } from "#app/data/servers";
import { SITE } from "#app/data/site";
import type { ServerSnapshot } from "#app/data/snapshots";
import { fetchDiscordCounts } from "#app/server/discord";
import { fetchGitHubStats, type GitHubStats } from "#app/server/github";
import { pollingSnapshot, queryServers } from "#app/server/mindustry/status";
import { createNodeMindustryProbe } from "#app/server/mindustry/transport";
import { Poller, type PollerHealth } from "#app/server/poller";

export interface ServicesHealth {
  status: "ok";
  uptimeSeconds: number;
  servers: PollerHealth;
  discord: PollerHealth;
  github: PollerHealth;
}

const WAITING = pollingSnapshot(servers);

export class Services {
  readonly #probe = createNodeMindustryProbe();
  readonly #startedAt = Date.now();
  readonly status = new Poller<ServerSnapshot>({
    name: "servers",
    intervalMs: 30_000,
    load: (signal) => queryServers(this.#probe, servers, signal),
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
    return this.status.value ?? WAITING;
  }

  get live(): LiveData {
    return {
      servers: this.servers,
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
