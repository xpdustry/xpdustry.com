import { projectForTopic, type ProjectTheme } from "#app/brand/projects";
import { PATCHES } from "#app/textures/cards";
import { PALETTE } from "#app/ui/styles/palette";

export interface Topic extends ProjectTheme {
  name: string;
  icon?: string;
  website?: string;
}

export const SITE_THEME: ProjectTheme = {
  ground: PALETTE.deep,
  patches: PATCHES.siteCover,
  muted: PALETTE.deepInk,
  chip: { background: PALETTE.t3, color: PALETTE.t12 },
  accent: PALETTE.t3
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
