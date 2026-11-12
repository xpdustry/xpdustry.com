import clajIcon from "#app/assets/brand/claj.png";
import nohornyIcon from "#app/assets/brand/nohorny.svg";
import { Package, PlugsConnected, Toolbox, type Icon } from "#app/components/ui/Icons";
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

/** The featured project gets the wide card, with a screenshot of it at work. */
interface FeaturedCard {
  kind: "featured";
  ground: string;
  /** The patches in its corners. */
  patches: Patches;
  muted: string;
  screenshot: string;
}

/** The others are small cards in a Mindustry item's colours, with an icon of what they do. */
interface ItemCard {
  kind: "item";
  ground: string;
  /** The patches in its corners. */
  patches: Patches;
  symbol: Icon;
}

export interface Project {
  slug: ProjectSlug;
  name: string;
  repository: `${string}/${string}`;
  summary: string;
  website?: string;
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
    website: "https://nohorny.xpdustry.com",
    summary:
      "NoHorny is a Mindustry server plugin that detects and removes NSFW art drawn on logic displays and canvases.",
    icon: nohornyIcon,
    card: {
      kind: "featured",
      ground: NOHORNY_THEME.ground,
      patches: PATCHES.nohornyCard,
      muted: NOHORNY_THEME.muted,
      screenshot: "/blog/nohorny-admin-overview-dark.webp",
    },
    theme: NOHORNY_THEME,
  },
  {
    slug: "claj",
    name: "CLaJ",
    repository: "xpdustry/claj",
    summary:
      "CLaJ (Copy Link and Join) is a Mindustry mod that lets you play with your friends through a shared link.",
    icon: clajIcon,
    card: {
      kind: "item",
      ground: "#d99d73",
      patches: PATCHES.clajCard,
      symbol: PlugsConnected,
    },
  },
  {
    slug: "toxopid",
    name: "Toxopid",
    repository: "xpdustry/toxopid",
    summary: "A Gradle plugin for building, testing and running Mindustry mods and plugins.",
    card: {
      kind: "item",
      ground: "#8da1e3",
      patches: PATCHES.toxopidCard,
      symbol: Package,
    },
  },
  {
    slug: "distributor",
    name: "Distributor",
    repository: "xpdustry/distributor",
    summary: "A framework offering utilities for Mindustry plugins.",
    card: {
      kind: "item",
      ground: "#e8dc80",
      patches: PATCHES.distributorCard,
      symbol: Toolbox,
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
