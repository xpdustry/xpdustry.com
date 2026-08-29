import { projects } from "#app/data/projects";

export interface ParsedReleaseId {
  repository: string;
  tag: string;
}

export function parseReleaseId(id: string): ParsedReleaseId | undefined {
  const at = id.lastIndexOf("@");
  if (at <= 0 || at === id.length - 1) return undefined;
  return { repository: id.slice(0, at), tag: id.slice(at + 1) };
}

export function releaseUrl(id: string): string {
  const parsed = parseReleaseId(id);
  if (!parsed) return "https://github.com/xpdustry";
  return `https://github.com/${parsed.repository
    .split("/")
    .map(encodeURIComponent)
    .join("/")}/releases/tag/${encodeURIComponent(parsed.tag)}`;
}

export function releaseLabel(id: string): string {
  const parsed = parseReleaseId(id);
  if (!parsed) return id;
  const project = projects.find((entry) => entry.repository === parsed.repository);
  return `${project?.name ?? parsed.repository.split("/")[1]} ${parsed.tag}`;
}
