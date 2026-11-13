import { existsSync } from "node:fs";
import { expect, test } from "vitest";
import { outbound } from "#app/ui/outbound";
import gt from "../../gt.config.json" with { type: "json" };
import { aboutIn, known, knownTeam, ranked } from "./team";

const everyone = Object.values(known);
const links = everyone.flatMap(({ github, website }) => [github, website]).filter(Boolean);
const faces = everyone.flatMap(({ avatar }) => avatar ?? []);

test.each(links)("%s is a teammate's: it learns where the visitor came from", (href) => {
  expect(outbound(href)).toEqual({ target: "_blank", rel: "noopener" });
});

test.each(faces)("%s is a picture the site serves", (avatar) => {
  expect(existsSync(`public${avatar}`)).toBe(true);
});

test("team.json is keyed by Discord user ID", () => {
  expect(Object.keys(known).filter((id) => !/^\d{17,20}$/.test(id))).toEqual([]);
});

test("tags come once each, highest first", () => {
  expect(ranked(["moderator", "developer", "moderator", "owner"])).toEqual([
    "owner",
    "developer",
    "moderator"
  ]);
});

test("before Discord answers, the team is whoever team.json names and tags, highest first", () => {
  expect(knownTeam.map(({ name, tags }) => [name, tags])).toEqual([
    ["ZetaMap", ["owner", "developer"]],
    ["Maxou", ["developer"]],
    ["phinner", ["developer"]]
  ]);
});

test.each(everyone.filter(({ about }) => about))(
  "$name's line is in every language",
  ({ about }) => {
    expect(Object.keys(about!).sort()).toEqual([gt.defaultLocale, ...gt.locales].sort());
  }
);

test("a line falls back to the default language", () => {
  const about = { en: "Hello", fr: "Bonjour" };
  expect(aboutIn({ about }, "fr", "en")).toBe("Bonjour");
  expect(aboutIn({ about }, "ru", "en")).toBe("Hello");
  expect(aboutIn({}, "ru", "en")).toBeUndefined();
});
