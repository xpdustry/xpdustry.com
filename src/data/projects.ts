import clajIcon from "#app/assets/brand/claj.png";
import nohornyIcon from "#app/assets/brand/nohorny.svg";
import copper from "#app/assets/mindustry/item-copper.png";
import surgeAlloy from "#app/assets/mindustry/item-surge-alloy.png";
import titanium from "#app/assets/mindustry/item-titanium.png";
import { PATCHES } from "#app/data/patches";
import type { Patches } from "#app/data/textures";

export type ProjectSlug = "nohorny" | "claj" | "toxopid" | "distributor";

/** How a project's posts are dressed: their topic chip, and the cover of the post page. */
export interface ProjectTheme {
  /** The cover's ground and its patches. */
  ground: string;
  patches: Patches;
  /** Secondary text on the cover. */
  muted: string;
  /** The topic chip on light cards. */
  chip: { background: string; color: string };
  /** The topic chip on the cover. */
  accent: string;
}

/** A card's colours for its piece of the grid's labyrinth: the patch, and the lines in its core. */
export type PieceTones = readonly [color: string, inner: string];

/** The featured project gets the wide card, with a screenshot of it at work. */
interface FeaturedCard {
  kind: "featured";
  ground: string;
  piece: PieceTones;
  muted: string;
  screenshot: string;
}

/** The others are small cards in a Mindustry item's colours, with the item's sprite. */
interface ItemCard {
  kind: "item";
  ground: string;
  piece: PieceTones;
  item: string;
}

export interface Project {
  slug: ProjectSlug;
  name: string;
  repository: `${string}/${string}`;
  summary: string;
  icon?: string;
  card: FeaturedCard | ItemCard;
  theme?: ProjectTheme;
}

const NOHORNY_THEME: ProjectTheme = {
  ground: "#2a1520",
  patches: PATCHES.nohornyCover,
  muted: "#f3d3e1",
  chip: { background: "#f9a3c7", color: "#3a0f22" },
  accent: "#f9cfe1",
};

/** In display order. */
export const projects: readonly Project[] = [
  {
    slug: "nohorny",
    name: "NoHorny",
    repository: "xpdustry/nohorny",
    summary:
      "Detects and removes NSFW imagery from logic displays and canvases, with an admin panel to review every catch.",
    icon: nohornyIcon,
    card: {
      kind: "featured",
      ground: NOHORNY_THEME.ground,
      piece: ["#4d2238", "#3b1b2c"],
      muted: NOHORNY_THEME.muted,
      screenshot: "/blog/nohorny-admin-overview-dark.webp",
    },
    theme: NOHORNY_THEME,
  },
  {
    slug: "claj",
    name: "CLaJ",
    repository: "xpdustry/claj",
    summary: "A proxy that lets players join each other's games directly.",
    icon: clajIcon,
    card: {
      kind: "item",
      ground: "#d99d73",
      piece: ["#bf7b50", "#cc8b60"],
      item: copper,
    },
  },
  {
    slug: "toxopid",
    name: "Toxopid",
    repository: "xpdustry/toxopid",
    summary: "Gradle plugin for Mindustry mods and plugins.",
    card: {
      kind: "item",
      ground: "#8da1e3",
      piece: ["#6c80d2", "#7d90da"],
      item: titanium,
    },
  },
  {
    slug: "distributor",
    name: "Distributor",
    repository: "xpdustry/distributor",
    summary: "Utilities for Mindustry plugins.",
    card: {
      kind: "item",
      ground: "#e8dc80",
      piece: ["#ccc15a", "#d9d06f"],
      item: surgeAlloy,
    },
  },
];

export function repositoryUrl(project: Project): string {
  return `https://github.com/${project.repository}`;
}

/** Posts are filed under a topic, which is a project's name when they are about one. */
export function projectForTopic(topic: string): Project | undefined {
  return projects.find((project) => project.name.toLowerCase() === topic.toLowerCase());
}
