import { projects } from "#app/brand/projects";
import { SITE } from "#app/brand/site";

interface ParsedReleaseId {
  repository: string;
  tag: string;
}

function parseReleaseId(id: string): ParsedReleaseId | undefined {
  const at = id.lastIndexOf("@");
  if (at <= 0 || at === id.length - 1) return undefined;
  return { repository: id.slice(0, at), tag: id.slice(at + 1) };
}

export function releaseUrl(id: string): string {
  const parsed = parseReleaseId(id);
  if (!parsed) return SITE.github;
  return `https://github.com/${parsed.repository
    .split("/")
    .map(encodeURIComponent)
    .join("/")}/releases/tag/${encodeURIComponent(parsed.tag)}`;
}

/**
 * The tag alone for a release of `ownRepository`, the project the post is about, which the post
 * already names; the project and the tag for any other.
 */
export function releaseLabel(id: string, ownRepository?: string): string {
  const parsed = parseReleaseId(id);
  if (!parsed) return id;
  if (parsed.repository === ownRepository) return parsed.tag;
  const project = projects.find((entry) => entry.repository === parsed.repository);
  return `${project?.name ?? parsed.repository.split("/")[1]} ${parsed.tag}`;
}
