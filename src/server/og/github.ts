// Stars and forks for the home card, summed over the featured repositories.
//
// Unauthenticated GitHub allows sixty calls an hour, so one answer is kept for
// that long and every caller in between shares it. A failed refresh keeps the
// last answer; before there is one, the card simply omits the counts.

import { projects } from "#app/data/projects";

export interface RepositoryStats {
  stars: number;
  forks: number;
}

interface Repository {
  full_name: string;
  stargazers_count: number;
  forks_count: number;
}

const GITHUB_ORG = "xpdustry";
const MAX_AGE_MS = 60 * 60 * 1000;
const TIMEOUT_MS = 5000;

let known: RepositoryStats | undefined;
let refreshedAt = Number.NEGATIVE_INFINITY;
let refreshing: Promise<void> | undefined;

export async function readRepositoryStats(
  fetchImpl: typeof fetch = fetch,
): Promise<RepositoryStats | undefined> {
  if (Date.now() - refreshedAt >= MAX_AGE_MS) {
    refreshing ??= refresh(fetchImpl).finally(() => {
      refreshing = undefined;
    });
    await refreshing;
  }
  return known;
}

async function refresh(fetchImpl: typeof fetch): Promise<void> {
  // The timestamp moves even on failure, so an outage costs one call an hour.
  refreshedAt = Date.now();
  try {
    known = await fetchStats(fetchImpl);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[github] refresh failed: ${message}`);
  }
}

async function fetchStats(fetchImpl: typeof fetch): Promise<RepositoryStats> {
  const response = await fetchImpl(
    `https://api.github.com/orgs/${GITHUB_ORG}/repos?per_page=100&type=public`,
    {
      headers: { accept: "application/vnd.github+json", "user-agent": "xpdustry-website" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  if (!response.ok) {
    throw new Error(`GitHub answered ${response.status} ${response.statusText}`);
  }

  const repositories = (await response.json()) as Repository[];
  const byName = new Map(repositories.map((repository) => [repository.full_name, repository]));
  const missing = projects.filter((project) => !byName.has(project.repository));
  if (missing.length > 0) {
    throw new Error(`GitHub did not return ${missing.map((p) => p.repository).join(", ")}`);
  }

  const featured = projects.map((project) => byName.get(project.repository)!);
  return {
    stars: featured.reduce((total, repository) => total + repository.stargazers_count, 0),
    forks: featured.reduce((total, repository) => total + repository.forks_count, 0),
  };
}
