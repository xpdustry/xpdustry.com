import { SITE } from "#app/brand/site";
import { knownTeam, type Teammate } from "#app/brand/team";
import type { DiscordCounts, LiveData } from "../live";
import { servers } from "../servers";
import type { ServerSnapshot } from "../snapshots";
import { fetchDiscordCounts } from "./discord";
import { fetchGitHubStats, type GitHubStats } from "./github";
import { pollingSnapshot, queryServers } from "./mindustry/status";
import { createNodeMindustryProbe } from "./mindustry/transport";
import { Poller, type PollerHealth } from "./poller";
import { fetchTeam, teamConfig } from "./team";

interface ServicesHealth {
  status: "ok";
  uptimeSeconds: number;
  servers: PollerHealth;
  discord: PollerHealth;
  github: PollerHealth;
  team: PollerHealth;
}

const WAITING = pollingSnapshot(servers);

const TEAM = teamConfig(process.env);

class Services {
  readonly #probe = createNodeMindustryProbe();
  readonly #startedAt = Date.now();
  readonly status = new Poller<ServerSnapshot>({
    name: "servers",
    intervalMs: 30_000,
    load: (signal) => queryServers(this.#probe, servers, signal)
  });
  readonly discord = new Poller<DiscordCounts>({
    name: "discord",
    intervalMs: 5 * 60_000,
    load: (signal) => fetchDiscordCounts(SITE.discordInvite, signal)
  });
  readonly github = new Poller<GitHubStats>({
    name: "github",
    intervalMs: 60 * 60_000,
    load: (signal) => fetchGitHubStats(signal)
  });
  readonly #team = new Poller<Teammate[]>({
    name: "team",
    intervalMs: 30 * 60_000,
    // A thousand members a call, then two per teammate, each of which Discord may have wait.
    timeoutMs: 5 * 60_000,
    load: (signal) => (TEAM ? fetchTeam(TEAM, signal) : Promise.resolve(knownTeam))
  });

  start(): void {
    this.status.start();
    this.discord.start();
    this.github.start();
    this.#team.start();
  }

  stop(): void {
    this.status.stop();
    this.discord.stop();
    this.github.stop();
    this.#team.stop();
    this.#probe.closeAll();
  }

  get servers(): ServerSnapshot {
    return this.status.value ?? WAITING;
  }

  get live(): LiveData {
    return {
      servers: this.servers,
      discord: this.discord.value,
      releases: this.github.value?.releases ?? {}
    };
  }

  /** Whoever holds a team role on Discord, or `team.json`'s team until Discord answers. */
  get team(): Teammate[] {
    return this.#team.value ?? knownTeam;
  }

  get health(): ServicesHealth {
    return {
      status: "ok",
      uptimeSeconds: Math.round((Date.now() - this.#startedAt) / 1000),
      servers: this.status.health,
      discord: this.discord.health,
      github: this.github.health,
      team: this.#team.health
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
