import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, test } from "vitest";

const handlerPath = fileURLToPath(new URL("../../dist/server/index.js", import.meta.url));
const manifestPath = fileURLToPath(
  new URL("../../dist/client/.vite/manifest.json", import.meta.url),
);
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
    expect((html.match(/data-reticulate/g) ?? []).length).toBe(1);
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

  test("the theme override runs before styles load", async () => {
    const html = await (await get("/")).text();
    const head = html.slice(0, html.indexOf("</head>"));
    const bootstrap = head.indexOf("xpdustry-theme");

    expect(bootstrap).toBeGreaterThanOrEqual(0);
    expect(bootstrap).toBeLessThan(head.indexOf("stylesheet"));
  });

  test("the client stylesheet contains the theme and generated-content contracts", async () => {
    const manifest: unknown = JSON.parse(await readFile(manifestPath, "utf8"));
    if (typeof manifest !== "object" || manifest === null) throw new Error("invalid manifest");

    const entry = Reflect.get(manifest, "virtual:solid-ssr-entry-client.tsx");
    if (typeof entry !== "object" || entry === null) throw new Error("missing client entry");

    const css = Reflect.get(entry, "css");
    if (!Array.isArray(css) || !css.every((file): file is string => typeof file === "string")) {
      throw new Error("invalid client CSS entry");
    }

    const source = (
      await Promise.all(css.map((file) => readFile(`${clientRoot}${file}`, "utf8")))
    ).join("\n");

    expect(source).toContain("light-dark(#ebf0f4,#0b1218)");
    expect(source).toContain("data-theme=light");
    expect(source).toContain("data-theme=dark");
    expect(source).toContain("html:has(#projects:target,#servers:target){scroll-behavior:smooth}");
    expect(source).toContain("height:min(100%,100rem)");
    expect(source).toContain("markdown-alert");
    expect(source).toContain("post-media__frame");
    expect(source).toContain("@font-face");
    expect(source).toContain("Archivo Variable");
    expect(source).toContain("Martian Mono");
    expect(source).toMatch(/\.woff2/);
    expect(source).toMatch(/reticulate-[\w-]+\.png/);

    const assets = [
      ...new Set([...source.matchAll(/url\(["']?(\/assets\/[^)"']+)/g)].map((match) => match[1])),
    ];
    expect(assets.length).toBeGreaterThan(0);
    await Promise.all(assets.map((asset) => readFile(`${clientRoot}${asset.slice(1)}`)));
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
    expect(aliases).toEqual([
      "hub.md.xpdustry.com",
      "survival.md.xpdustry.com",
      "sandbox.md.xpdustry.com",
      "pvp.md.xpdustry.com",
      "attack.md.xpdustry.com",
      "tower.md.xpdustry.com",
      "event.md.xpdustry.com",
    ]);
    expect(
      snapshot.servers.every((server: { status: string }) => server.status === "polling"),
    ).toBe(true);
    expect(body).not.toMatch(/"online"\s*:|"state"\s*:|"polledAt"|"pingMs"/);
  });
});
