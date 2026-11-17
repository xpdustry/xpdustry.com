import { describe, expect, test } from "vitest";
import { projects } from "#app/brand/projects";
import { fakeFetch, type Route } from "#tests/support/fetch";
import { fetchGitHubStats } from "./github";

interface Repository {
  full_name: string;
  stargazers_count: number;
}

const FEATURED: Repository[] = projects.map((project, index) => ({
  full_name: project.repository,
  stargazers_count: 10 * (index + 1)
}));

const OTHERS: Repository[] = Array.from({ length: 120 }, (_, at) => ({
  full_name: `xpdustry/other-${at}`,
  stargazers_count: 1
}));

const API = "https://api.github.com";
const MAX_PER_PAGE = 100;

function listing(url: URL, repositories: readonly Repository[]): Response {
  const perPage = Math.min(Number(url.searchParams.get("per_page") ?? 30), MAX_PER_PAGE);
  const page = Number(url.searchParams.get("page") ?? 1);
  const pages = Math.ceil(repositories.length / perPage);
  const link = (to: number, rel: string) => {
    const target = new URL(url);
    target.searchParams.set("page", String(to));
    return `<${target.href}>; rel="${rel}"`;
  };
  const links = [
    ...(page < pages ? [link(page + 1, "next"), link(pages, "last")] : []),
    ...(page > 1 ? [link(1, "first"), link(page - 1, "prev")] : [])
  ];
  return Response.json(repositories.slice((page - 1) * perPage, page * perPage), {
    headers: links.length > 0 ? { link: links.join(", ") } : {}
  });
}

const notFound = () => Response.json({ message: "Not Found" }, { status: 404 });

const RELEASES: Record<string, string[]> = {
  "xpdustry/nohorny": ["v4.0.0-beta.11"],
  "xpdustry/claj": ["2.4.4"]
};

function github(
  org: readonly Repository[],
  answer?: (path: string) => Response | undefined
): Route {
  return (url) => {
    if (url.origin !== API) return undefined;
    const overridden = answer?.(url.pathname);
    if (overridden) return overridden;
    if (url.pathname === "/orgs/xpdustry/repos") return listing(url, org);
    const releases = /^\/repos\/(.+\/.+)\/releases$/.exec(url.pathname)?.[1];
    if (releases) {
      return Response.json((RELEASES[releases] ?? []).map((tag_name) => ({ tag_name })));
    }
    const repository = org.find(({ full_name }) => `/repos/${full_name}` === url.pathname);
    return repository ? Response.json(repository) : notFound();
  };
}

const signal = new AbortController().signal;

describe("GitHub stats", () => {
  test("sums the featured repositories' stars and reads each latest release", async () => {
    const fetchImpl = fakeFetch(github([...FEATURED, ...OTHERS]));

    await expect(fetchGitHubStats(signal, fetchImpl)).resolves.toEqual({
      stars: 10 + 20 + 30 + 40,
      releases: { nohorny: "v4.0.0-beta.11", claj: "2.4.4" }
    });
  });

  test("finds a featured repository the organisation lists only on its second page", async () => {
    const [first, ...rest] = FEATURED;
    const org = [...rest, ...OTHERS, first!];
    expect(org.indexOf(first!)).toBeGreaterThanOrEqual(MAX_PER_PAGE);

    await expect(fetchGitHubStats(signal, fakeFetch(github(org)))).resolves.toMatchObject({
      stars: 10 + 20 + 30 + 40
    });
  });

  test("fails when GitHub does not know a featured repository", async () => {
    const fetchImpl = fakeFetch(github([...FEATURED.slice(1), ...OTHERS]));

    await expect(fetchGitHubStats(signal, fetchImpl)).rejects.toThrow(/xpdustry\/nohorny/);
  });

  test("reports the status GitHub answered with", async () => {
    const limited = fakeFetch(
      github(FEATURED, () => Response.json({ message: "rate limited" }, { status: 403 }))
    );

    await expect(fetchGitHubStats(signal, limited)).rejects.toThrow(/403/);
  });
});
