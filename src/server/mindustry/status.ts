import type { ServerDefinition } from "#app/data/servers";
import type { ServerInfo, ServerSnapshot } from "#app/data/snapshots";

export interface MindustryStatusProbe {
  query: (hostname: string, signal: AbortSignal) => Promise<ServerInfo>;
}

/** Every server as not yet asked: what pages show until the first answers are in. */
export function pollingSnapshot(servers: readonly ServerDefinition[]): ServerSnapshot {
  return { servers: servers.map((server) => ({ ...server, status: "polling" })) };
}

/**
 * Asks every server at once and waits for them all, so a page never mixes two rounds. A server
 * that does not answer is offline; the others are unaffected. Throws if `signal` aborts, as
 * the answers are then cut short rather than missing.
 */
export async function queryServers(
  probe: MindustryStatusProbe,
  servers: readonly ServerDefinition[],
  signal: AbortSignal
): Promise<ServerSnapshot> {
  const results = await Promise.allSettled(
    servers.map((server) => probe.query(server.hostname, signal))
  );
  signal.throwIfAborted();
  return {
    servers: servers.map((server, index) => {
      const result = results[index]!;
      return result.status === "fulfilled"
        ? { ...server, status: "online", info: result.value }
        : { ...server, status: "offline" };
    })
  };
}
