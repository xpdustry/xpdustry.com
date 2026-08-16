/**
 * Integration tests against the real SSR handler.
 *
 * The handler is imported from `dist/server`, so these check the artifact that
 * actually ships rather than a dev-server approximation. They are skipped with
 * a clear message when there is no build to point at.
 *
 * The runtime's poller is never started here: an unpolled snapshot is a valid
 * state and the loading path is exactly what a cold start serves.
 */

import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, test } from "vitest";

const HANDLER = fileURLToPath(new URL("../../dist/server/index.js", import.meta.url));
const built = existsSync(HANDLER);
const suite = built ? describe : describe.skip;

if (!built) {
  // eslint-disable-next-line no-console
  console.warn("[integration] dist/server not found. Run `pnpm build` first. Skipping.");
}

let handleRequest: (request: Request) => Promise<Response>;

async function get(path: string, init?: RequestInit): Promise<Response> {
  return handleRequest(new Request(`https://www.xpdustry.com${path}`, init));
}

suite("SSR routes", () => {
  beforeAll(async () => {
    ({ handleRequest } = await import(HANDLER));
  });

  test.each([
    ["/", "We build open-source software for Mindustry."],
    ["/blog", "Release notes"],
    ["/blog/nohorny-4-beta-1", "Just in time for Mindustry v8"],
    ["/blog/nohorny-4-beta-8", "Discord alerts are now blurred"],
    ["/projects", "Our best open source tools"],
    ["/projects/nohorny", "How it works"],
    ["/projects/nohorny/install", "Install the jar"],
    ["/projects/nohorny/settings", "Settings"],
    ["/projects/nohorny/server", "Run your own server"],
  ])("%s renders its content server-side", async (path, needle) => {
    const response = await get(path);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain(needle);
  });

  test("an unknown path renders the branded 404 with a 404 status", async () => {
    const response = await get("/no-such-page");
    expect(response.status).toBe(404);

    const html = await response.text();
    expect(html).toContain("this page does not exist");
    // Home, Projects and Blog, and nothing that only exists in development.
    expect(html).toContain('href="/projects"');
    expect(html).toContain('href="/blog"');
    expect(html).not.toContain("styleguide");
  });

  test("the style guide does not exist in a production build", async () => {
    expect((await get("/styleguide")).status).toBe(404);
  });

  test("the homepage is useful before either poller has succeeded", async () => {
    const html = await (await get("/")).text();
    // The section, its heading and every server alias are server-rendered
    // whether or not a poll has landed.
    expect(html).toContain(">Mindustry servers</h2>");
    expect(html).not.toContain(
      '<p class="lead">We also run the Chaotic Neutral Mindustry servers.</p>',
    );
    for (const alias of ["hub", "survival", "sandbox", "pvp", "attack", "tower", "event"]) {
      expect(html).toContain(`${alias}.md.xpdustry.com`);
    }
    // Hexed is deliberately excluded.
    expect(html).not.toContain("hexed.md.xpdustry.com");
  });

  test("the homepage lists the four projects in the agreed order", async () => {
    const html = await (await get("/")).text();
    const positions = ["NoHorny", "CLaJ", "Toxopid", "Distributor"].map((name) =>
      html.indexOf(`>${name}<`),
    );
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  test("each project card is one link, to its pages here or to its repository", async () => {
    const html = await (await get("/")).text();
    // NoHorny has pages, so its card stays on the site; CLaJ has none.
    expect(html).toContain('href="/projects/nohorny"');
    expect(html).toContain('href="https://github.com/xpdustry/claj"');
    expect(html).not.toContain("https://github.com/xpdustry/nohorny");
  });

  test("a post reaches its release changelog on GitHub", async () => {
    const html = await (await get("/blog/nohorny-4-beta-8")).text();
    expect(html).toContain("https://github.com/xpdustry/nohorny/releases/tag/v4.0.0-beta.8");
  });

  test("a post links its author to GitHub", async () => {
    const html = await (await get("/blog/nohorny-4-beta-8")).text();
    expect(html).toContain('href="https://github.com/phinner"');
    expect(html).toContain('src="/phinner.svg"');
  });

  test("post descriptions stay in metadata instead of repeating below titles", async () => {
    const home = await (await get("/")).text();
    const post = await (await get("/blog/nohorny-4-beta-8")).text();

    expect(home).not.toContain('class="postcard__excerpt"');
    expect(post).not.toContain('class="post__lead"');
    expect(post).toContain('<meta name="description"');
  });

  test("post cards use the project as their single topic", async () => {
    const html = await (await get("/blog")).text();
    const topics = [...html.matchAll(/data-topic="([^"]+)"/g)].map((match) => match[1]);

    expect(topics).toHaveLength(4);
    // Every post on the site is a NoHorny post right now; the assertion that
    // matters is that a topic names a project rather than a free-form tag.
    expect(new Set(topics)).toEqual(new Set(["NoHorny"]));
  });

  test.each([
    ["/", "Xpdustry"],
    ["/blog", "Blog · Xpdustry"],
    ["/blog/nohorny-4-beta-1", "Say hello to NoHorny v4 beta 1 · Xpdustry"],
    ["/projects/nohorny/install", "Install the plugin · Xpdustry"],
  ])("%s has exactly one title, and it is its own", async (path, expected) => {
    const html = await (await get(path)).text();
    const titles = [...html.matchAll(/<title[^>]*>([^<]*)<\/title>/g)].map((match) => match[1]);
    // Two titles is not a cosmetic bug: the browser keeps the first, so a
    // static one in the document shell silently overrides every page.
    expect(titles).toEqual([expected]);
  });

  test("every page carries a title, description and canonical url", async () => {
    for (const path of ["/", "/blog", "/projects", "/projects/nohorny"]) {
      const html = await (await get(path)).text();
      expect(html, path).toContain('<meta name="description"');
      expect(html, path).toContain(`<link rel="canonical" href="https://www.xpdustry.com${path}"`);
      expect(html, path).toContain('property="og:title"');
    }
  });

  test("the theme is resolved before hydration, so there is no flash", async () => {
    const html = await (await get("/")).text();
    const head = html.slice(0, html.indexOf("</head>"));
    // The bootstrap has to be inline and ahead of the stylesheet link.
    expect(head).toContain("prefers-color-scheme: dark");
    expect(head).toContain("xpdustry-theme");
    expect(head.indexOf("xpdustry-theme")).toBeLessThan(head.indexOf("stylesheet"));
  });

  test("every page offers a skip link and one page-level heading", async () => {
    for (const path of ["/", "/blog", "/projects/nohorny/install"]) {
      const html = await (await get(path)).text();
      expect(html, path).toContain("Skip to content");
      expect((html.match(/<h1[\s>]/g) ?? []).length, path).toBe(1);
    }
  });
});

suite("API routes", () => {
  beforeAll(async () => {
    ({ handleRequest } = await import(HANDLER));
  });

  test("/healthz is 200 while upstreams are still cold", async () => {
    const response = await get("/healthz");
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(typeof body.uptimeSeconds).toBe("number");
    expect(body.servers).toMatchObject({ state: expect.any(String) });
  });

  test("/healthz leaks no secrets, addresses or stack traces", async () => {
    const body = await (await get("/healthz")).text();
    expect(body).not.toMatch(/token|Bearer|_mindustry\._tcp|\.internal|at .*\.js:\d+/i);
  });

  test("/healthz is never cached", async () => {
    expect((await get("/healthz")).headers.get("cache-control")).toContain("no-store");
  });

  test("/api/servers returns only the hardcoded aliases, whatever the query says", async () => {
    const response = await get("/api/servers?hostname=127.0.0.1&port=53");
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=15, stale-while-revalidate=30",
    );

    const body = await response.json();
    const aliases = body.servers.map((entry: { hostname: string }) => entry.hostname);
    expect(aliases).toEqual([
      "hub.md.xpdustry.com",
      "survival.md.xpdustry.com",
      "sandbox.md.xpdustry.com",
      "pvp.md.xpdustry.com",
      "attack.md.xpdustry.com",
      "tower.md.xpdustry.com",
      "event.md.xpdustry.com",
    ]);
    expect(JSON.stringify(body)).not.toContain("127.0.0.1");
  });

  test("the API responses carry no token under any key", async () => {
    for (const path of ["/api/servers", "/healthz"]) {
      expect(await (await get(path)).text(), path).not.toMatch(/gh[pousr]_|authorization/i);
    }
  });

  test("the release API is gone rather than left answering", async () => {
    expect((await get("/api/releases")).status).toBe(404);
  });
});
