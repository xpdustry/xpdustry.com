import { expect, test } from "vitest";
import { SITE } from "#app/brand/site";
import { releaseLabel, releaseUrl } from "./releases";

test.each([
  ["xpdustry/nohorny@v4.0.0", undefined, "NoHorny v4.0.0"],
  ["someone/plugin@1.2", undefined, "plugin 1.2"],
  ["xpdustry/nohorny@v4.0.0", "xpdustry/nohorny", "v4.0.0"],
  ["xpdustry/claj@v2", "xpdustry/nohorny", "CLaJ v2"],
  // A repository name cannot hold an @ and a tag can: the first one splits.
  ["xpdustry/claj@scope@v2", undefined, "CLaJ scope@v2"],
  ["changesets/changesets@@changesets/cli@2.27.1", undefined, "changesets @changesets/cli@2.27.1"],
  ["@v2", undefined, "@v2"],
  ["xpdustry/claj@", undefined, "xpdustry/claj@"]
])("labels %s, in a post about %s, as %s", (id, ownProject, label) => {
  expect(releaseLabel(id, ownProject)).toBe(label);
});

const TAG = "https://github.com/xpdustry/claj/releases/tag/";

test.each([
  [
    "xpdustry/nohorny@v4.0.0-beta.1",
    "https://github.com/xpdustry/nohorny/releases/tag/v4.0.0-beta.1"
  ],
  ["xpdustry/claj@v1#2", `${TAG}v1%232`],
  ["xpdustry/claj@50%off", `${TAG}50%25off`],
  ["xpdustry/claj@scope@v2", `${TAG}scope%40v2`],
  [
    "changesets/changesets@@changesets/cli@2.27.1",
    "https://github.com/changesets/changesets/releases/tag/%40changesets%2Fcli%402.27.1"
  ],
  ["nothing", SITE.github]
])("links %s to %s", (id, url) => {
  expect(releaseUrl(id)).toBe(url);
});
