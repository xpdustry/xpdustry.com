import { describe, expect, test } from "vitest";
import { projects } from "#app/brand/projects";
import { SITE_THEME, topic } from "./topics";

const project = (name: string) => projects.find((candidate) => candidate.name === name)!;

describe("topic", () => {
  test("dresses a post in the project it names, its colours included, whatever the case", () => {
    const nohorny = project("NoHorny");
    expect(topic("nohorny")).toEqual({
      name: "nohorny",
      icon: nohorny.icon,
      website: nohorny.website,
      ...nohorny.theme
    });
  });

  test("gives a project without a theme of its own the site's, and no website it lacks", () => {
    expect(topic("CLaJ")).toEqual({ name: "CLaJ", icon: project("CLaJ").icon, ...SITE_THEME });
    expect(topic("CLaJ").website).toBeUndefined();
  });

  test("gives a topic that names no project the site's theme, and no icon or website", () => {
    expect(topic("Announcements")).toEqual({ name: "Announcements", ...SITE_THEME });
  });
});
