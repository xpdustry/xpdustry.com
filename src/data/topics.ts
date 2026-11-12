import { projectForTopic, type ProjectTheme } from "#app/data/projects";
import { patches } from "#app/data/textures";

export interface Topic extends ProjectTheme {
  name: string;
  icon?: string;
}

/** Topics that are not a project wear the site's own deep teal. */
const DEFAULT_THEME: ProjectTheme = {
  ground: "#083230",
  texture: patches("#104643", "#0c3c39", [
    [0.95, 0.1, 0.42, 1],
    [0.78, 1.05, 0.22, 1],
    [0.04, 1.1, 0.14, 1],
  ]),
  muted: "#a2c2bf",
  chip: { background: "#c6f6f2", color: "#003331" },
  accent: "#c6f6f2",
};

export function topic(name: string): Topic {
  const project = projectForTopic(name);
  return { name, icon: project?.icon, ...(project?.theme ?? DEFAULT_THEME) };
}
