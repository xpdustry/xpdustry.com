import { describe, expect, test, vi } from "vitest";
import { projects } from "#app/data/projects";
import { readRepositoryStats } from "#app/server/og/github";

function answering(body: unknown, status = 200): typeof fetch {
  return vi.fn(async () => Response.json(body, { status }));
}

const repositories = projects.map((project, index) => ({
  full_name: project.repository,
  stargazers_count: 10 * (index + 1),
  forks_count: index + 1,
}));

describe("repository stats", () => {
  test("sums the featured repositories and keeps the answer", async () => {
    const fetchImpl = answering(repositories);
    await expect(readRepositoryStats(fetchImpl)).resolves.toEqual({ stars: 100, forks: 10 });
    await expect(readRepositoryStats(fetchImpl)).resolves.toEqual({ stars: 100, forks: 10 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  test("a failed refresh keeps the last answer", async () => {
    vi.useFakeTimers();
    try {
      vi.advanceTimersByTime(61 * 60 * 1000);
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      await expect(
        readRepositoryStats(answering({ message: "rate limited" }, 403)),
      ).resolves.toEqual({ stars: 100, forks: 10 });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("403"));
    } finally {
      vi.useRealTimers();
    }
  });
});
