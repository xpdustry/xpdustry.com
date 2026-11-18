import { describe, expect, test } from "vitest";
import { morphsWithItsPost } from "./morph";

const IDENTIFIER = /^-?[_a-zA-Z][_a-zA-Z0-9-]*$/;

const names = (slug: string) => Object.values(morphsWithItsPost(slug));

describe("morphsWithItsPost", () => {
  test.each(["nohorny-4-beta-8", "release.1", "release:1", "hello world", "français", "1beta"])(
    "names every part of %s with a valid identifier",
    (slug) => {
      for (const name of names(slug)) expect(name).toMatch(IDENTIFIER);
    }
  );

  test("keeps different slugs apart, even when one spells out the other's encoding", () => {
    const slugs = ["release.1", "release-1", "release_1", "release_2e_1", "release:1"];
    const cards = slugs.map((slug) => names(slug)[0]);
    expect(new Set(cards).size).toBe(slugs.length);
  });
});
