import sharp from "sharp";
import { expect, test } from "vitest";
import gt from "../../gt.config.json" with { type: "json" };
import { aboutIn, known, knownTeam, ranked } from "./team";

const everyone = Object.values(known);
const faces = everyone.flatMap(({ avatar }) => avatar ?? []);

test("team.json's faces are pictures the site serves, square as the round frame they sit in", async () => {
  expect(faces.length).toBeGreaterThan(0);
  for (const avatar of faces) {
    const { width, height } = await sharp(`public${avatar}`).metadata();
    expect(width, avatar).toBe(height);
  }
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
    [".json", ["developer"]],
    ["Maxou", ["developer"]],
    ["phinner", ["developer"]]
  ]);
});

test.each(everyone.filter(({ about }) => about))(
  "$name's line is in every language the site serves, and no other",
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
