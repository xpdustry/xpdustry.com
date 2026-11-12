import { CastleTurret, Crosshair, Cube, Shield, Sword, type Icon } from "#app/lib/icons";
import { EDGES, SPREADS } from "#app/data/patches";
import type { Fringe, Patches, SpreadTiles } from "#app/data/textures";

export interface Gamemode {
  /** The `servers` entry that runs it. */
  server: string;
  name: string;
  description: string;
  icon: Icon;
  /**
   * Its colour, as the frayed edges its header ends in: patches down its side, or a fringe along
   * its foot where the header lies across the card.
   */
  edge: { side: Patches; below: Fringe };
  /** Its reticulate, which spreads over the card when its address is copied. */
  spread: SpreadTiles;
}

export const gamemodes: readonly Gamemode[] = [
  {
    server: "survival",
    name: "Survival",
    description: "The classic Mindustry experience. Defend against waves of enemy units.",
    icon: Shield,
    edge: EDGES.survival,
    spread: SPREADS.survival,
  },
  {
    server: "pvp",
    name: "PvP",
    description: "Fight and destroy other players with your team.",
    icon: Sword,
    edge: EDGES.pvp,
    spread: SPREADS.pvp,
  },
  {
    server: "attack",
    name: "Attack",
    description: "Team up against a fortified enemy base and destroy its cores.",
    icon: Crosshair,
    edge: EDGES.attack,
    spread: SPREADS.attack,
  },
  {
    server: "tower",
    name: "Tower Defense",
    description: "Line the path with turrets and stop the enemies reaching your core.",
    icon: CastleTurret,
    edge: EDGES.tower,
    spread: SPREADS.tower,
  },
  {
    server: "sandbox",
    name: "Sandbox",
    description: "Unlimited resources. Build and test anything you like.",
    icon: Cube,
    edge: EDGES.sandbox,
    spread: SPREADS.sandbox,
  },
];
