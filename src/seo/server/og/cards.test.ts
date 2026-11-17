import { describe, expect, test } from "vitest";
import { readCard } from "./cards";

const french = { locale: "fr", m: (message: string) => message };

describe("readCard", () => {
  test.each(["", "about.png", "blog/no-such-post.png", "blog/.png", "constructor", "__proto__"])(
    "has no card at %j",
    async (path) => {
      expect(await readCard(path, french)).toBeUndefined();
    }
  );

  test("draws a card once, however many ask for it at the same time or later", async () => {
    const first = readCard("blog.png", french);
    const second = readCard("blog.png", french);

    const card = await first;
    expect(card?.byteLength).toBeGreaterThan(0);
    expect(await second).toBe(card);
    expect(await readCard("blog.png", french)).toBe(card);
  });
});
