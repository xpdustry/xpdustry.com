import { expect, test } from "vitest";
import { projects } from "#app/brand/projects";
import { fakeFetch } from "#tests/support/fetch";
import { fetchGitHubStats } from "./github";

/** What GitHub answers for each path production asks, and nothing else. */
const ANSWERS: Record<string, unknown> = Object.fromEntries([
  ...projects.flatMap(({ repository }, at) => [
    [`/repos/${repository}`, { stargazers_count: 10 * (at + 1) }],
    [`/repos/${repository}/releases`, []]
  ]),
  ["/repos/xpdustry/nohorny/releases", [{ tag_name: "v4.0.0-beta.11" }]],
  ["/repos/xpdustry/claj/releases", [{ tag_name: "2.4.4" }]]
]);

const github = (refusing: Record<string, number> = {}) =>
  fakeFetch(({ origin, pathname }) => {
    if (origin !== "https://api.github.com") return undefined;
    const status = refusing[pathname] ?? (pathname in ANSWERS ? 200 : 404);
    return Response.json(status === 200 ? ANSWERS[pathname] : { message: "refused" }, { status });
  });

const signal = new AbortController().signal;

test.each([
  ["each latest release", {}, { nohorny: "v4.0.0-beta.11", claj: "2.4.4" }],
  [
    "those GitHub does not refuse",
    { "/repos/xpdustry/claj/releases": 403 },
    { nohorny: "v4.0.0-beta.11" }
  ]
])("GitHub stats sum the featured stars and read %s", async (_, refusing, releases) => {
  await expect(fetchGitHubStats(signal, github(refusing))).resolves.toEqual({
    stars: 10 + 20 + 30 + 40,
    releases
  });
});

test("GitHub stats fail with the status GitHub answered for a featured repository", async () => {
  await expect(
    fetchGitHubStats(signal, github({ "/repos/xpdustry/nohorny": 404 }))
  ).rejects.toThrow(/404 .* for \/repos\/xpdustry\/nohorny$/);
});
