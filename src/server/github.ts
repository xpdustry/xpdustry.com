// What the site shows from GitHub: each project's latest release, and the stars on the social card.
//
// Unauthenticated GitHub allows sixty calls an hour per address; one refresh costs one call for
// the organisation's repositories plus one per project, and runs hourly.

import { projects, type ProjectSlug } from "#app/data/projects";

export interface GitHubStats {
  /** Stars over the featured repositories. */
  stars: number;
  /** The newest release tag of each project, prereleases included. */
  releases: Partial<Record<ProjectSlug, string>>;
}

interface Repository {
  full_name: string;
  stargazers_count: number;
}

interface Release {
  tag_name: string;
}

const GITHUB_ORG = "xpdustry";
const HEADERS = { accept: "application/vnd.github+json", "user-agent": "xpdustry-website" };

export async function fetchGitHubStats(
  signal: AbortSignal,
  fetchImpl: typeof fetch = fetch,
): Promise<GitHubStats> {
  const get = async <T>(path: string): Promise<T> => {
    const response = await fetchImpl(`https://api.github.com${path}`, { headers: HEADERS, signal });
    if (!response.ok) {
      throw new Error(`GitHub answered ${response.status} ${response.statusText} for ${path}`);
    }
    return (await response.json()) as T;
  };

  const [repositories, releases] = await Promise.all([
    get<Repository[]>(`/orgs/${GITHUB_ORG}/repos?per_page=100&type=public`),
    // A project without a release, or one GitHub fails to answer for, just shows no version.
    Promise.allSettled(
      projects.map((project) => get<Release[]>(`/repos/${project.repository}/releases?per_page=1`)),
    ),
  ]);

  const byName = new Map(repositories.map((repository) => [repository.full_name, repository]));
  const missing = projects.filter((project) => !byName.has(project.repository));
  if (missing.length > 0) {
    throw new Error(`GitHub did not return ${missing.map((p) => p.repository).join(", ")}`);
  }

  return {
    stars: projects.reduce(
      (total, project) => total + byName.get(project.repository)!.stargazers_count,
      0,
    ),
    releases: Object.fromEntries(
      projects.flatMap((project, index) => {
        const result = releases[index]!;
        const tag = result.status === "fulfilled" ? result.value[0]?.tag_name : undefined;
        return tag ? [[project.slug, tag]] : [];
      }),
    ),
  };
}
