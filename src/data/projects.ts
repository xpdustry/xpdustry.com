import clajIcon from "#app/assets/brand/claj.png";
import nohornyIcon from "#app/assets/brand/nohorny.svg";
import copper from "#app/assets/mindustry/item-copper.png";
import surgeAlloy from "#app/assets/mindustry/item-surge-alloy.png";
import titanium from "#app/assets/mindustry/item-titanium.png";
import { patches, type TextureSettings } from "#app/data/textures";

export type ProjectSlug = "nohorny" | "claj" | "toxopid" | "distributor";

/** How a project's posts are dressed: their topic chip, and the cover of the post page. */
export interface ProjectTheme {
  /** The cover's ground and its texture. */
  ground: string;
  texture: TextureSettings;
  /** Secondary text on the cover. */
  muted: string;
  /** The topic chip on light cards. */
  chip: { background: string; color: string };
  /** The topic chip on the cover. */
  accent: string;
}

/** The featured project gets the wide card, with a screenshot of it at work. */
interface FeaturedCard {
  kind: "featured";
  ground: string;
  texture: TextureSettings;
  muted: string;
  screenshot: string;
}

/** The others are small cards in a Mindustry item's colours, with the item's sprite. */
interface ItemCard {
  kind: "item";
  ground: string;
  texture: TextureSettings;
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
  texture: patches("#4d2238", "#3b1b2c", [
    [0.95, 0.1, 0.42, 1],
    [0.78, 1.05, 0.22, 1],
    [0.04, 1.1, 0.14, 1],
  ]),
  muted: "#f3d3e1",
  chip: { background: "#f9a3c7", color: "#3a0f22" },
  accent: "#f9cfe1",
};

const itemPatches = [
  [0.83, 0.68, 0.4, 1],
  [0.42, 1.04, 0.12, 1],
] as const;

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
      texture: patches("#4d2238", "#3b1b2c", [
        [1.02, 0, 0.32, 1],
        [0.02, 0.55, 0.16, 1],
      ]),
      muted: NOHORNY_THEME.muted,
      screenshot: "/blog/nohorny-admin-overview-dark.png",
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
      texture: patches("#bf7b50", "#cc8b60", itemPatches),
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
      texture: patches("#6c80d2", "#7d90da", itemPatches),
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
      texture: patches("#ccc15a", "#d9d06f", itemPatches),
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
