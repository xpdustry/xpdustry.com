import coreShard from "#app/assets/mindustry/core-shard.png";
import dagger from "#app/assets/mindustry/dagger.png";
import duo from "#app/assets/mindustry/duo.png";
import lancer from "#app/assets/mindustry/lancer.png";
import mechanicalDrill from "#app/assets/mindustry/mechanical-drill.png";
import ripple from "#app/assets/mindustry/ripple.png";
import shot1 from "#app/assets/screenshots/shot1.webp";
import shot2 from "#app/assets/screenshots/shot2.webp";
import shot3 from "#app/assets/screenshots/shot3.webp";
import { PATCHES } from "#app/data/patches";
import type { Patches } from "#app/data/textures";

/** A sprite placed on the row's icon, in px from the icon's top left. */
export interface IconSprite {
  src: string;
  left: number;
  top: number;
  width: number;
}

export interface Gamemode {
  /** The `servers` entry that runs it. */
  server: string;
  name: string;
  description: string;
  /** The row's background while it is open. */
  tint: string;
  icon: { patches: Patches[]; sprites: IconSprite[] };
  /** The sprites standing on the panel's photo, at their own width in px. */
  figures: { src: string; width: number }[];
  screenshot: { src: string; position: string };
}

export const gamemodes: readonly Gamemode[] = [
  {
    server: "survival",
    name: "Survival",
    description:
      "Defend your core against waves of enemy units, and grow a factory big enough to outlast them.",
    tint: "#f9e9cd",
    icon: {
      patches: [PATCHES.survival],
      sprites: [{ src: coreShard, left: 40, top: 42, width: 36 }],
    },
    figures: [{ src: coreShard, width: 96 }],
    screenshot: { src: shot2, position: "50% 35%" },
  },
  {
    server: "pvp",
    name: "PvP",
    description:
      "Every team starts with a core and nothing else. Mine, build an army, and destroy the other cores before they reach yours.",
    tint: "#e4eaff",
    icon: {
      patches: [PATCHES.pvpBlue, PATCHES.pvpRed],
      sprites: [
        { src: lancer, left: 30, top: 48, width: 30 },
        { src: ripple, left: 52, top: 33, width: 36 },
      ],
    },
    figures: [
      { src: lancer, width: 64 },
      { src: ripple, width: 96 },
    ],
    screenshot: { src: shot1, position: "20% 50%" },
  },
  {
    server: "attack",
    name: "Attack",
    description:
      "The enemy base is already built and armed. Grow your factory, break through its defences and destroy every core.",
    tint: "#ffe3e2",
    icon: {
      patches: [PATCHES.attack],
      sprites: [{ src: dagger, left: 40, top: 42, width: 36 }],
    },
    figures: [{ src: dagger, width: 96 }],
    screenshot: { src: shot1, position: "92% 30%" },
  },
  {
    server: "tower",
    name: "Tower Defense",
    description:
      "Enemies march along one path toward your core and get tougher every minute. Every kill drops resources for the next turret.",
    tint: "#dcf2e2",
    icon: {
      patches: [PATCHES.tower],
      sprites: [{ src: duo, left: 40, top: 42, width: 36 }],
    },
    figures: [{ src: duo, width: 64 }],
    screenshot: { src: shot3, position: "6% 50%" },
  },
  {
    server: "sandbox",
    name: "Sandbox",
    description:
      "Every resource is unlimited. Test a schematic, try out a design, or build something huge just because you can.",
    tint: "#eee8fa",
    icon: {
      patches: [PATCHES.sandbox],
      sprites: [{ src: mechanicalDrill, left: 40, top: 42, width: 36 }],
    },
    figures: [{ src: mechanicalDrill, width: 96 }],
    screenshot: { src: shot3, position: "46% 50%" },
  },
];
