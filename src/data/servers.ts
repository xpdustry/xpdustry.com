/**
 * The launch server list, fixed in code.
 *
 * `/api/servers` answers for these aliases and nothing else. Accepting a
 * hostname from a request would turn the endpoint into a way to make this
 * machine send UDP packets anywhere, so the list is never widened at runtime.
 *
 * Hexed is absent on purpose: `hexed.md.xpdustry.com` has no SRV record yet.
 */

export interface ServerDefinition {
  slug: string;
  label: string;
  /** The address a player types. Always the thing shown and copied. */
  hostname: string;
}

export const servers: readonly ServerDefinition[] = [
  { slug: "hub", label: "Hub", hostname: "hub.md.xpdustry.com" },
  { slug: "survival", label: "Survival", hostname: "survival.md.xpdustry.com" },
  { slug: "sandbox", label: "Sandbox", hostname: "sandbox.md.xpdustry.com" },
  { slug: "pvp", label: "PvP", hostname: "pvp.md.xpdustry.com" },
  { slug: "attack", label: "Attack", hostname: "attack.md.xpdustry.com" },
  { slug: "tower", label: "Tower Defense", hostname: "tower.md.xpdustry.com" },
  { slug: "event", label: "Event", hostname: "event.md.xpdustry.com" },
];
