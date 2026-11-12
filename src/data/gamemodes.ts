import { msg } from "gt-tanstack-start";
import { EDGES, SPREADS } from "#app/data/patches";
import { CastleTurret, Crosshair, Cube, Shield, Sword, type Icon } from "#app/lib/icons";
import type { Fringe, Patches, SpreadTiles } from "#app/lib/textures";

export interface Gamemode {
  /** The `servers` entry that runs it. */
  server: string;
  name: string;
  description: string;
  icon: Icon;
  edge: { side: Patches; below: Fringe };
  spread: SpreadTiles;
}

export const gamemodes: readonly Gamemode[] = [
  {
    server: "survival",
    name: msg("Survival"),
    description: msg("The classic Mindustry experience. Defend against waves of enemy units."),
    icon: Shield,
    edge: EDGES.survival,
    spread: SPREADS.survival
  },
  {
    server: "pvp",
    name: msg("PvP"),
    description: msg("Fight and destroy other players with your team."),
    icon: Sword,
    edge: EDGES.pvp,
    spread: SPREADS.pvp
  },
  {
    server: "attack",
    name: msg("Attack"),
    description: msg("Team up against a fortified enemy base and destroy its cores."),
    icon: Crosshair,
    edge: EDGES.attack,
    spread: SPREADS.attack
  },
  {
    server: "tower",
    name: msg("Tower Defense"),
    description: msg("Line the path with turrets and stop the enemies reaching your core."),
    icon: CastleTurret,
    edge: EDGES.tower,
    spread: SPREADS.tower
  },
  {
    server: "sandbox",
    name: msg("Sandbox"),
    description: msg("Unlimited resources. Build and test anything you like."),
    icon: Cube,
    edge: EDGES.sandbox,
    spread: SPREADS.sandbox
  }
];
