import { expect, test } from "vitest";
import { projects } from "#app/brand/projects";
import { SITE_THEME, topic } from "./topics";

const project = (name: string) => projects.find((candidate) => candidate.name === name)!;
const nohorny = project("NoHorny");

test.each([
  [
    "the project it names, colours included, whatever the case",
    "nohorny",
    { icon: nohorny.icon, website: nohorny.website, ...nohorny.theme }
  ],
  [
    "the site's theme for a project without one",
    "CLaJ",
    { icon: project("CLaJ").icon, ...SITE_THEME }
  ],
  ["the site's theme and no icon for a topic that names no project", "Announcements", SITE_THEME]
])("dresses a post in %s", (_label, name, dress) => {
  expect(topic(name)).toEqual({ name, ...dress });
});
