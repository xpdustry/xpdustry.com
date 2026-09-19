import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, test } from "vitest";

const handlerPath = fileURLToPath(new URL("../../dist/server/index.js", import.meta.url));
const clientRoot = fileURLToPath(new URL("../../dist/client/", import.meta.url));
let handleRequest: (request: Request) => Promise<Response>;

process.env.XPD_DISABLE_STATUS = "1";

async function get(path: string): Promise<Response> {
  return handleRequest(new Request(`https://xpdustry.com${path}`));
}

beforeAll(async () => {
  ({ handleRequest } = await import(handlerPath));
});

describe("built pages", () => {
  test("publishes crawler metadata", async () => {
    const [robots, sitemap] = await Promise.all([
      readFile(`${clientRoot}robots.txt`, "utf8"),
      readFile(`${clientRoot}sitemap.xml`, "utf8"),
    ]);

    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Sitemap: https://xpdustry.com/sitemap.xml");
    expect(sitemap).toContain("<loc>https://xpdustry.com/</loc>");
    expect(sitemap).toContain("<loc>https://xpdustry.com/blog</loc>");
    expect(sitemap).toContain("<loc>https://xpdustry.com/blog/nohorny-4-beta-8</loc>");
    expect(sitemap).not.toContain("styleguide");
  });

  test.each([
    ["/", "Pretty cool Mindustry tools."],
    ["/blog", "Release notes"],
    ["/blog/nohorny-4-beta-8", "Discord alerts are now blurred"],
  ])("%s renders its primary content", async (path, content) => {
    const response = await get(path);
    expect(response.status).toBe(200);

    const html = await response.text();
    expect(html).toContain(content);
    expect((html.match(/<h1[\s>]/g) ?? []).length).toBe(1);
  });

  test("unknown routes retain their requested canonical URL", async () => {
    const response = await get("/no-such-page");
    expect(response.status).toBe(404);

    const html = await response.text();
    expect(html).toContain("this page does not exist");
    expect(html).toContain('<link rel="canonical" href="https://xpdustry.com/no-such-page"');
  });

  test("the development style guide is absent from production", async () => {
    expect((await get("/styleguide")).status).toBe(404);
  });

  test("route metadata replaces rather than duplicates document metadata", async () => {
    const html = await (await get("/blog")).text();
    const titles = [...html.matchAll(/<title[^>]*>([^<]*)<\/title>/g)].map((match) => match[1]);

    expect(titles).toEqual(["Blog - Xpdustry"]);
    expect(html).toContain('<meta name="description"');
    expect(html).toContain('<link rel="canonical" href="https://xpdustry.com/blog"');
  });
});

describe("built API", () => {
  test("health reports liveness without exposing internals", async () => {
    const response = await get("/healthz");
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(JSON.parse(body)).toMatchObject({ status: "ok" });
    expect(body).not.toMatch(/token|Bearer|_mindustry\._tcp|\.internal|at .*\.js:\d+/i);
  });

  test("server status ignores request-supplied targets and hides resolved endpoints", async () => {
    const response = await get("/api/servers?hostname=127.0.0.1&port=53");
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).not.toContain("127.0.0.1");
    expect(body).not.toMatch(/"resolvedHost"|"resolvedPort"/);

    const snapshot = JSON.parse(body);
    const aliases = snapshot.servers.map((server: { hostname: string }) => server.hostname);
    expect(aliases.length).toBeGreaterThan(0);
    const baseline = await (await get("/api/servers")).json();
    expect(snapshot).toEqual(baseline);
    expect(
      snapshot.servers.every((server: { status: string }) => server.status === "polling"),
    ).toBe(true);
  });
});

describe("built social cards", () => {
  test("every page points at a card the server renders", async () => {
    for (const path of ["/", "/blog", "/blog/nohorny-4-beta-8"]) {
      const html = await (await get(path)).text();
      const card = /<meta property="og:image" content="https:\/\/xpdustry\.com([^"]+)"/.exec(
        html,
      )?.[1];
      expect(card, path).toMatch(/^\/og\/.+\.png$/);
      // The home card reaches for GitHub, which the artifact suite must not depend on.
      if (path === "/") continue;

      const response = await get(card!);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("image/png");
      expect(response.headers.get("cache-control")).toContain("max-age=3600");
      expect(new Uint8Array(await response.arrayBuffer()).subarray(1, 4)).toEqual(
        new TextEncoder().encode("PNG"),
      );
    }
  });

  test("unknown cards are not rendered", async () => {
    expect((await get("/og/blog/no-such-post.png")).status).toBe(404);
    expect((await get("/og/home")).status).toBe(404);
  });
});
