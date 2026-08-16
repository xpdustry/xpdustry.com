/**
 * Release ids are `owner/repo@tag`. That string is the join key between a
 * post's frontmatter and a polled GitHub release, so it has to be derivable
 * without the poller having run.
 */

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

/** The GitHub changelog for a release. A release card always reaches this. */
export function releaseUrl(id: string): string {
  const parsed = parseReleaseId(id);
  if (!parsed) return "https://github.com/xpdustry";
  return `https://github.com/${parsed.repository}/releases/tag/${parsed.tag}`;
}

/** `NoHorny v4.0.0-beta.8`, falling back to the repository name off-list. */
export function releaseLabel(id: string): string {
  const parsed = parseReleaseId(id);
  if (!parsed) return id;
  const project = projects.find((entry) => entry.repository === parsed.repository);
  return `${project?.name ?? parsed.repository.split("/")[1]} ${parsed.tag}`;
}
