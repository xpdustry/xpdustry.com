/**
 * Project copy lives here, not on GitHub.
 *
 * Release data is polled and changes without warning; the order, the summary
 * and the summary are editorial and must not move when someone edits a
 * repository description.
 */

import fallbackIcon from "#app/assets/logo-monochrome.svg";
import clajIcon from "#app/assets/projects/claj.png";
import nohornyIcon from "#app/assets/projects/nohorny.svg";

export type ProjectSlug = "nohorny" | "claj" | "toxopid" | "distributor";

export interface ProjectDefinition {
  slug: ProjectSlug;
  name: string;
  repository: `${string}/${string}`;
  summary: string;
  order: number;
  /** Set when the project has pages on this site, rooted at /projects/<slug>. */
  hosted?: boolean;
  /** The project's own mark. Projects without one borrow the Xpdustry cog. */
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
    hosted: true,
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

export const projectsBySlug: ReadonlyMap<ProjectSlug, ProjectDefinition> = new Map(
  projects.map((project) => [project.slug, project]),
);

export function repositoryUrl(project: ProjectDefinition): string {
  return `https://github.com/${project.repository}`;
}

/** Where the project's own root page lives on this site, if it has one. */
export function overviewPath(project: ProjectDefinition): string | undefined {
  return project.hosted ? `/projects/${project.slug}` : undefined;
}

/**
 * The one destination a project card points at.
 *
 * A project with pages here is read here; one without has nothing to say that
 * its repository does not say better, so the card goes straight to GitHub.
 */
export function projectUrl(project: ProjectDefinition): string {
  return overviewPath(project) ?? repositoryUrl(project);
}

export interface ProjectIcon {
  src: string;
  /** The fallback is a black mark, so it has to be inverted on a dark page. */
  fallback: boolean;
}

export function projectIcon(project: ProjectDefinition): ProjectIcon {
  return project.icon
    ? { src: project.icon, fallback: false }
    : { src: fallbackIcon, fallback: true };
}
