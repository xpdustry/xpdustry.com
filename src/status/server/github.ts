import * as v from "valibot";
import { projects, type ProjectSlug } from "#app/brand/projects";

export interface GitHubStats {
  stars: number;
  releases: Partial<Record<ProjectSlug, string>>;
}

const RepositorySchema = v.object({ stargazers_count: v.number() });
const NewestReleaseSchema = v.array(v.object({ tag_name: v.string() }));

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
    Promise.all(projects.map((project) => get(`/repos/${project.repository}`, RepositorySchema))),
    Promise.allSettled(
      projects.map((project) =>
        get(`/repos/${project.repository}/releases?per_page=1`, NewestReleaseSchema)
      )
    )
  ]);

  return {
    stars: repositories.reduce((total, repository) => total + repository.stargazers_count, 0),
    releases: Object.fromEntries(
      projects.flatMap((project, index) => {
        const result = releases[index]!;
        const tag = result.status === "fulfilled" ? result.value[0]?.tag_name : undefined;
        return tag ? [[project.slug, tag]] : [];
      })
    )
  };
}
