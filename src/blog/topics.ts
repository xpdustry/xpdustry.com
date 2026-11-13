import { projectForTopic, type ProjectTheme } from "#app/brand/projects";
import { PATCHES } from "#app/textures/cards";

export interface Topic extends ProjectTheme {
  name: string;
  icon?: string;
  website?: string;
}

/** The site's own theme, worn by posts outside any project and by the site's social cards. */
export const SITE_THEME: ProjectTheme = {
  ground: "#083230",
  patches: PATCHES.siteCover,
  muted: "#a2c2bf",
  chip: { background: "#c6f6f2", color: "#003331" },
  accent: "#c6f6f2"
};

export function topic(name: string): Topic {
  const project = projectForTopic(name);
  return {
    name,
    icon: project?.icon,
    website: project?.website,
    ...(project?.theme ?? SITE_THEME)
  };
}
