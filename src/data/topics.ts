import { projectForTopic, type ProjectTheme } from "#app/data/projects";
import { PATCHES } from "#app/textures/cards";

export interface Topic extends ProjectTheme {
  name: string;
  icon?: string;
  website?: string;
}

const DEFAULT_THEME: ProjectTheme = {
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
    ...(project?.theme ?? DEFAULT_THEME)
  };
}
