import { describe, expect, test } from "vitest";
import { posts } from "#app/blog/content/registry";
import { readCard } from "./cards";

const english = { locale: "en", m: (message: string) => message };
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

describe("readCard", () => {
  test.each(["home.png", "blog.png", `blog/${posts[0]!.slug}.png`])(
    "draws %s as a PNG",
    async (path) => {
      const png = await readCard(path, english);

      expect([...png!.subarray(0, 8)]).toEqual(PNG_SIGNATURE);
    }
  );

  test.each(["", "about.png", "blog/no-such-post.png", "blog/.png", "constructor"])(
    "has no card at %j",
    async (path) => {
      expect(await readCard(path, english)).toBeUndefined();
    }
  );

  test("draws a card once and serves it again from the cache", async () => {
    const first = readCard("blog.png", { locale: "fr", m: english.m });
    const second = readCard("blog.png", { locale: "fr", m: english.m });

    expect(await second).toBe(await first);
    expect(await readCard("blog.png", { locale: "fr", m: english.m })).toBe(await first);
  });
});
