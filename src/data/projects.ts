import clajIcon from "#app/assets/projects/claj.png";
import nohornyIcon from "#app/assets/projects/nohorny.svg";

export type ProjectSlug = "nohorny" | "claj" | "toxopid" | "distributor";

export interface ProjectDefinition {
  slug: ProjectSlug;
  name: string;
  repository: `${string}/${string}`;
  summary: string;
  order: number;
  icon?: string;
}

export const projects: readonly ProjectDefinition[] = [
  {
    slug: "nohorny",
    name: "NoHorny",
    repository: "xpdustry/nohorny",
    summary:
      "A safety plugin that detects and removes NSFW imagery from logic displays and canvases.",
    order: 1,
    icon: nohornyIcon,
  },
  {
    slug: "claj",
    name: "CLaJ",
    repository: "xpdustry/claj",
    summary: "A proxy that lets players join each other's games directly.",
    order: 2,
    icon: clajIcon,
  },
  {
    slug: "toxopid",
    name: "Toxopid",
    repository: "xpdustry/toxopid",
    summary: "A Gradle plugin for building, testing and running Mindustry mods and plugins.",
    order: 3,
  },
  {
    slug: "distributor",
    name: "Distributor",
    repository: "xpdustry/distributor",
    summary: "A framework offering utilities for Mindustry plugins.",
    order: 4,
  },
];

export function repositoryUrl(project: ProjectDefinition): string {
  return `https://github.com/${project.repository}`;
}
