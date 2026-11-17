import * as v from "valibot";
import { projects, type ProjectSlug } from "#app/brand/projects";

export interface GitHubStats {
  stars: number;
  releases: Partial<Record<ProjectSlug, string>>;
}

const RepositoriesSchema = v.array(
  v.object({ full_name: v.string(), stargazers_count: v.number() })
);
const NewestReleaseSchema = v.array(v.object({ tag_name: v.string() }));

const GITHUB_ORG = "xpdustry";
const HEADERS = { accept: "application/vnd.github+json", "user-agent": "xpdustry-website" };

export async function fetchGitHubStats(
  signal: AbortSignal,
  fetchImpl: typeof fetch = fetch
): Promise<GitHubStats> {
  const get = async <T>(path: string, schema: v.GenericSchema<unknown, T>): Promise<T> => {
    const response = await fetchImpl(`https://api.github.com${path}`, { headers: HEADERS, signal });
    if (!response.ok) {
      throw new Error(`GitHub answered ${response.status} ${response.statusText} for ${path}`);
    }
    return v.parse(schema, await response.json());
  };

  const [repositories, releases] = await Promise.all([
    get(`/orgs/${GITHUB_ORG}/repos?per_page=100&type=public`, RepositoriesSchema),
    Promise.allSettled(
      projects.map((project) =>
        get(`/repos/${project.repository}/releases?per_page=1`, NewestReleaseSchema)
      )
    )
  ]);

  const byName = new Map(repositories.map((repository) => [repository.full_name, repository]));
  const missing = projects.filter((project) => !byName.has(project.repository));
  if (missing.length > 0) {
    throw new Error(`GitHub did not return ${missing.map((p) => p.repository).join(", ")}`);
  }

  return {
    stars: projects.reduce(
      (total, project) => total + byName.get(project.repository)!.stargazers_count,
      0
    ),
    releases: Object.fromEntries(
      projects.flatMap((project, index) => {
        const result = releases[index]!;
        const tag = result.status === "fulfilled" ? result.value[0]?.tag_name : undefined;
        return tag ? [[project.slug, tag]] : [];
      })
    )
  };
}
