import { createHash } from "node:crypto";
import { expect, test } from "vitest";
import { httpGet } from "#tests/support/http.ts";
import { HOSTILE_VISITOR, get } from "#tests/support/served.ts";
import { startProductionServer } from "#tests/support/server.ts";

const SHARED = [
  "/og/home.png",
  "/fr/og/home.png",
  "/fr/og/blog.png",
  "/ru/og/blog.png",
  "/fr/og/blog/nohorny-4-beta-8.png",
  "/sitemap.xml",
  "/api/servers"
];

async function digest(response: Response): Promise<string> {
  return createHash("sha256")
    .update(new Uint8Array(await response.arrayBuffer()))
    .digest("hex");
}

test("a card's language comes from its address", async () => {
  const russian = await get("/ru/og/blog.png");
  expect(russian.status).toBe(200);
  expect(russian.headers.get("content-type")).toBe("image/png");
  expect(await digest(russian)).not.toBe(await digest(await get("/og/blog.png")));
});

test.for(["/og/blog/no-such-post.png", "/og/home"])("%s is not a card", async (path) => {
  expect((await get(path)).status).toBe(404);
});

test("a visitor cannot change what a shared cache keeps", async () => {
  const fresh = await startProductionServer();
  try {
    for (const path of SHARED) {
      const poisoned = await httpGet(fresh.origin + path, HOSTILE_VISITOR);
      const clean = await get(path);
      expect(poisoned.status, path).toBe(200);
      expect(poisoned.headers.get("cache-control"), path).toMatch(/^public\b/);
      for (const response of [poisoned, clean]) {
        expect(response.headers.get("set-cookie"), path).toBeNull();
        expect(response.headers.get("vary") ?? "", path).not.toMatch(/cookie|accept-language/i);
      }
      expect(await digest(poisoned), path).toBe(await digest(clean));
    }
    const picture = await httpGet(`${fresh.origin}/discord/avatars/1/a.webp`, HOSTILE_VISITOR);
    expect(picture.status).toBe(404);
    expect(picture.headers.get("set-cookie")).toBeNull();
  } finally {
    await fresh.stop();
  }
}, 30_000);
