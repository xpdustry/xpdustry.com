import { describe, expect, test } from "vitest";
import { projects } from "#app/brand/projects";
import { fakeFetch, pathsOn } from "#tests/support/fetch";
import { fetchGitHubStats } from "./github";

const repositories = projects.map((project, index) => ({
  full_name: project.repository,
  stargazers_count: 10 * (index + 1)
}));

const github = (paths: Record<string, () => Response>) =>
  fakeFetch(pathsOn("api.github.com", paths));

const signal = new AbortController().signal;

describe("GitHub stats", () => {
  test("sums the featured repositories' stars and reads each latest release", async () => {
    const fetchImpl = github({
      "/orgs/xpdustry/repos": () => Response.json(repositories),
      "/repos/xpdustry/nohorny/releases": () => Response.json([{ tag_name: "v4.0.0-beta.11" }]),
      "/repos/xpdustry/claj/releases": () => Response.json([{ tag_name: "2.4.4" }]),
      "/repos/xpdustry/toxopid/releases": () => Response.json([])
    });

    await expect(fetchGitHubStats(signal, fetchImpl)).resolves.toEqual({
      stars: 10 + 20 + 30 + 40,
      releases: { nohorny: "v4.0.0-beta.11", claj: "2.4.4" }
    });
  });

  test("fails when the organisation listing is missing a project", async () => {
    const fetchImpl = github({
      "/orgs/xpdustry/repos": () => Response.json(repositories.slice(1))
    });

    await expect(fetchGitHubStats(signal, fetchImpl)).rejects.toThrow(/xpdustry\/nohorny/);
  });

  test("reports the status GitHub answered with", async () => {
    const fetchImpl = github({
      "/orgs/xpdustry/repos": () => Response.json({ message: "rate limited" }, { status: 403 })
    });

    await expect(fetchGitHubStats(signal, fetchImpl)).rejects.toThrow(/403/);
  });
});
