export interface ServerDefinition {
  slug: string;
  label: string;
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
