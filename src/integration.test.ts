import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { readdir, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, test } from "vitest";
import { LEGACY_MEDIA_REDIRECTS } from "#app/seo/server/redirects";

const entryPath = fileURLToPath(new URL("../dist/server/server.js", import.meta.url));
const clientRoot = fileURLToPath(new URL("../dist/client/", import.meta.url));
let fetchApp: (request: Request) => Promise<Response>;

process.env.XPD_DISABLE_STATUS = "1";

async function get(path: string): Promise<Response> {
  return fetchApp(new Request(`https://xpdustry.com${path}`));
}

beforeAll(async () => {
  const entry = (await import(entryPath)) as {
    default: { fetch: (request: Request) => Promise<Response> };
  };
  fetchApp = (request) => entry.default.fetch(request);
});

async function digest(response: Response): Promise<string> {
  return createHash("sha256")
    .update(new Uint8Array(await response.arrayBuffer()))
    .digest("hex");
}

/** A fresh `scripts/serve.ts` on a free port, with caches of its own. */
async function startProductionServer(): Promise<{ origin: string; stop: () => Promise<void> }> {
  const server = spawn(process.execPath, ["scripts/serve.ts"], {
    cwd: fileURLToPath(new URL("../", import.meta.url)),
    env: { ...process.env, PORT: "0", HOST: "127.0.0.1", TEST: "" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  const exited = once(server, "exit");
  const stop = async () => {
    server.kill();
    await exited;
  };
  try {
    const origin = await new Promise<string>((resolve, reject) => {
      let output = "";
      server.stdout.on("data", (chunk) => {
        output += String(chunk);
        const address = /http:\/\/127\.0\.0\.1:\d+/.exec(output)?.[0];
        if (address) resolve(address);
      });
      server.stderr.on("data", (chunk) => {
        output += String(chunk);
      });
      server.once("error", reject);
      server.once("exit", () => reject(new Error(`File server exited: ${output}`)));
    });
    return { origin, stop };
  } catch (error) {
    await stop();
    throw error;
  }
}

describe("built pages", () => {
  test("publishes crawler metadata", async () => {
    const robots = await readFile(`${clientRoot}robots.txt`, "utf8");
    const sitemap = await (await get("/sitemap.xml")).text();

    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Sitemap: https://xpdustry.com/sitemap.xml");
    expect(sitemap).toContain("<loc>https://xpdustry.com/</loc>");
    expect(sitemap).toContain("<loc>https://xpdustry.com/blog</loc>");
    expect(sitemap).toContain("<loc>https://xpdustry.com/blog/nohorny-4-beta-8</loc>");
  });

  test.each(["/", "/blog", "/blog/nohorny-4-beta-8"])("%s has one heading", async (path) => {
    const response = await get(path);
    expect(response.status).toBe(200);
    expect(((await response.text()).match(/<h1[\s>]/g) ?? []).length).toBe(1);
  });

  test("a post renders its body on the server", async () => {
    const html = await (await get("/blog/nohorny-4-beta-8")).text();
    expect(html).toContain("Breaking change");
    expect(html).toMatch(/<img src="\/blog\/nohorny-discord-alert\.webp"/);
  });

  test.each(["/no-such-page", "/blog/no-such-post"])(
    "%s is a 404 excluded from indexing",
    async (path) => {
      const response = await get(path);
      expect(response.status).toBe(404);

      const html = await response.text();
      expect(html).toContain("this page does not exist");
      expect(html).not.toContain('<link rel="canonical"');
      expect(html).toContain('<meta name="robots" content="noindex"');
    }
  );

  test("home publishes a parseable website and organization graph", async () => {
    const html = await (await get("/")).text();
    const scripts = [
      ...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)
    ];
    expect(scripts).toHaveLength(1);
    expect(JSON.parse(scripts[0]![1]!)).toMatchObject({
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "WebSite", "@id": "https://xpdustry.com/#website" },
        {
          "@type": "Organization",
          "@id": "https://xpdustry.com/#organization",
          logo: "https://xpdustry.com/icon-512.png"
        }
      ]
    });
  });

  test.each([
    ["nohorny-4-beta-1", "Say hello to NoHorny v4 beta 1"],
    ["nohorny-4-beta-8", "NoHorny 4 Beta 8: Breaking changes and blurred alerts"]
  ])("%s identifies the product and publishes post structured data", async (slug, title) => {
    const html = await (await get(`/blog/${slug}`)).text();
    expect(html).toContain(`<title>${title} - Xpdustry</title>`);
    expect(html).toContain(`<meta property="og:title" content="${title} - Xpdustry"`);
    expect(html).toContain(`<meta name="twitter:title" content="${title} - Xpdustry"`);
    const scripts = [
      ...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)
    ];
    expect(scripts).toHaveLength(1);
    expect(JSON.parse(scripts[0]![1]!)).toMatchObject({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BlogPosting",
          headline: title,
          author: { "@type": "Person", name: "phinner", url: "https://github.com/phinner" },
          publisher: { "@id": "https://xpdustry.com/#organization" },
          image: `https://xpdustry.com/og/blog/${slug}.png`,
          mainEntityOfPage: `https://xpdustry.com/blog/${slug}`
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { position: 1, name: "Home" },
            { position: 2, name: "Blog" },
            { position: 3, name: title, item: `https://xpdustry.com/blog/${slug}` }
          ]
        }
      ]
    });
    const main = /<main\b[^>]*>([\s\S]*?)<\/main>/.exec(html)?.[1];
    const article = /<article\b[^>]*>([\s\S]*?)<\/article>/.exec(main ?? "")?.[1];
    expect(article).toMatch(
      /<header\b[\s\S]*<h1[^>]*>[\s\S]*NoHorny[\s\S]*<\/h1>[\s\S]*<time[\s\S]*<\/header>/
    );
    const heading = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(article ?? "")?.[1];
    expect(
      heading
        ?.replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim()
    ).toBe(title);
    expect(article).toContain("<p>");
    expect(main).toContain('id="more"');
  });

  test.each(["/", "/blog", "/blog/nohorny-4-beta-8"])(
    "%s only marks links to the current page as current",
    async (path) => {
      const html = await (await get(path)).text();
      const currentLinks = [...html.matchAll(/<a\b[^>]*aria-current="page"[^>]*>/g)];
      for (const [link] of currentLinks) {
        expect(/href="([^"]+)"/.exec(link)?.[1]).toBe(path);
      }
      if (path === "/" || path === "/blog") expect(currentLinks.length).toBeGreaterThan(0);
    }
  );

  test("route metadata replaces rather than duplicates document metadata", async () => {
    const html = await (await get("/blog")).text();
    const titles = [...html.matchAll(/<title[^>]*>([^<]*)<\/title>/g)].map((match) => match[1]);

    expect(titles).toHaveLength(1);
    expect(html.match(/<meta name="description"/g)).toHaveLength(1);
    expect(html).toContain('<link rel="canonical" href="https://xpdustry.com/blog"');
  });
});

describe("locales", () => {
  test.each(["fr", "ru"])(
    "/%s serves the site in that locale, under its own links",
    async (locale) => {
      const html = await (await get(`/${locale}/blog`)).text();
      expect(html).toContain(`<html lang="${locale}"`);
      expect(html).toContain(`href="/${locale}/blog/nohorny-4-beta-8"`);
      expect(html).toContain(`<link rel="canonical" href="https://xpdustry.com/${locale}/blog"`);
    }
  );

  test("every page names its other languages, to crawlers and in the sitemap", async () => {
    const html = await (await get("/blog/nohorny-4-beta-8")).text();
    for (const [lang, path] of [
      ["en", "/blog/nohorny-4-beta-8"],
      ["fr", "/fr/blog/nohorny-4-beta-8"],
      ["ru", "/ru/blog/nohorny-4-beta-8"],
      ["x-default", "/blog/nohorny-4-beta-8"]
    ]) {
      expect(html).toMatch(
        new RegExp(
          `<link rel="alternate" hrefLang="${lang}" href="https://xpdustry.com${path}"`,
          "i"
        )
      );
    }
    const sitemap = await (await get("/sitemap.xml")).text();
    expect(sitemap).toContain("<loc>https://xpdustry.com/ru/blog</loc>");
    expect(sitemap).toContain('hreflang="fr" href="https://xpdustry.com/fr/blog"');
  });

  test("a request that states no language gets the default one", async () => {
    const response = await get("/blog");
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('<html lang="en"');
  });

  test("a locale the site does not have is not a page", async () => {
    expect((await get("/de/blog")).status).toBe(404);
  });
});

describe("permanent redirects", () => {
  test.each([...LEGACY_MEDIA_REDIRECTS])("%s redirects to %s", async (from, to) => {
    const response = await get(`${from}?source=old%20link`);
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(`${to}?source=old%20link`);
    if (to.startsWith("/blog/")) {
      expect((await stat(`${clientRoot}${to.slice(1)}`)).isFile()).toBe(true);
    } else {
      expect((await get(to)).status).toBe(200);
    }
  });

  test.each(["/blog/", "/blog/nohorny-4-beta-8/", "/fr/blog/"])(
    "%s permanently removes its trailing slash and preserves queries",
    async (path) => {
      const response = await get(`${path}?q=a%20b&tag=one&tag=two`);
      expect(response.status).toBe(308);
      expect(response.headers.get("location")).toBe(`${path.slice(0, -1)}?q=a%20b&tag=one&tag=two`);
    }
  );

  test("does not invent replacements for unknown images", async () => {
    expect((await get("/blog/missing.png")).status).toBe(404);
  });
});

test("the production file server preserves every public URL from the previous site", async () => {
  const legacyFiles = [
    "/apple-touch-icon.png",
    "/blog/nohorny-admin-overview-dark.png",
    "/blog/nohorny-admin-requests-dark.png",
    "/blog/nohorny-discord-alert.png",
    "/blog/nohorny-request-dark.png",
    "/blog/nohorny-showcase-poster.jpg",
    "/blog/nohorny-showcase.mp4",
    "/blog/nohorny-site-hero-dark.png",
    "/favicon.ico",
    "/favicon.svg",
    "/icon-192.png",
    "/icon-512.png",
    "/og.png",
    "/phinner.svg",
    "/robots.txt",
    "/site.webmanifest"
  ];
  const { origin, stop } = await startProductionServer();
  try {
    for (const path of legacyFiles) {
      const response = await fetch(`${origin}${path}`, { method: "HEAD", redirect: "manual" });
      const target = LEGACY_MEDIA_REDIRECTS.get(path);
      expect(response.status, path).toBe(target ? 301 : 200);
      if (target) {
        expect(response.headers.get("location")).toBe(target);
        expect((await fetch(`${origin}${target}`, { method: "HEAD" })).status).toBe(200);
      }
    }
    const slash = await fetch(`${origin}/blog/?q=a%20b`, { redirect: "manual" });
    expect(slash.status).toBe(308);
    expect(slash.headers.get("location")).toBe("/blog?q=a%20b");

    for (const [accepted, coding] of [
      ["gzip;q=0", null],
      ["identity", null],
      ["br;q=0.5, gzip", "gzip"]
    ]) {
      const page = await fetch(`${origin}/`, { headers: { "accept-encoding": accepted! } });
      expect(page.headers.get("content-encoding"), accepted!).toBe(coding);
      expect(page.headers.get("vary"), accepted!).toMatch(/accept-encoding/i);
      expect(await page.text()).toContain("<title>Xpdustry");
    }
  } finally {
    await stop();
  }
});

test("the production server runs from what the container image ships", async () => {
  const root = new URL("../", import.meta.url);
  const shipped = [
    ...(await readFile(new URL("Containerfile", root), "utf8")).matchAll(
      /^COPY --from=build \S+ \/app\/(\S+)/gm
    )
  ].map(([, path]) => path);
  const imports = [
    ...(await readFile(new URL("scripts/serve.ts", root), "utf8")).matchAll(
      /(?:from|import\()\s*["'](\.[^"']+)["']/g
    )
  ].map(([, specifier]) => new URL(specifier, new URL("scripts/", root)).pathname);
  for (const imported of imports) {
    const path = imported.slice(root.pathname.length);
    expect(
      shipped.some((copied) => path === copied || path.startsWith(`${copied}/`)),
      `${path} is imported by scripts/serve.ts but not copied into the image`
    ).toBe(true);
  }
});

describe("post body chunks", () => {
  test.each(["/", "/blog", "/no-such-page"])(
    "%s does not preload any post bodies",
    async (path) => {
      const html = await (await get(path)).text();
      const preloads = [...html.matchAll(/<link[^>]*rel="modulepreload"[^>]*>/g)].join("\n");
      expect(preloads).not.toMatch(/nohorny-4-beta-\d+-/);
    }
  );

  test("each post body remains a separate dynamic chunk", async () => {
    const files = await readdir(`${clientRoot}assets`);
    const bodies = files.filter((file) => /^nohorny-4-beta-\d+-[^.]+\.js$/.test(file));
    const posts = await readdir(new URL("./blog/posts/", import.meta.url), { recursive: true });
    expect(bodies).toHaveLength(posts.filter((file) => file.endsWith(".md")).length);
    for (const body of bodies) {
      expect(await readFile(`${clientRoot}assets/${body}`, "utf8")).toContain("children");
    }
    const html = await (await get("/blog/nohorny-4-beta-8")).text();
    expect(html).toContain("Breaking change");
    expect(html).not.toMatch(/rel="modulepreload"[^>]*nohorny-4-beta-(?:1|3|7|11)-/);
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

  const sameOrigin = { origin: "https://xpdustry.com", "sec-fetch-site": "same-origin" };

  test.each(["unknown", "__proto__", "constructor", "", "unknown?payload=garbage"])(
    "server function %j is a plain 404",
    async (id) => {
      const response = await fetchApp(
        new Request(`https://xpdustry.com/_serverFn/${id}`, { headers: sameOrigin })
      );
      expect(response.status).toBe(404);
      expect(response.headers.has("set-cookie")).toBe(false);
      expect(await response.text()).toBe("Not Found");
    }
  );

  test("every server function the build defines still answers", async () => {
    const assets = fileURLToPath(new URL("../dist/server/assets/", import.meta.url));
    const ids: string[] = [];
    for (const file of await readdir(assets)) {
      if (!file.endsWith(".js")) continue;
      const code = await readFile(assets + file, "utf8");
      ids.push(...[...code.matchAll(/createServerRpc\(\{\s*id: "(\w+)"/g)].map(([, id]) => id!));
    }
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      const response = await fetchApp(
        new Request(`https://xpdustry.com/_serverFn/${id}`, { headers: sameOrigin })
      );
      expect(response.status, id).toBe(200);
    }
  });

  test("server status ignores request-supplied targets and hides resolved endpoints", async () => {
    const response = await get("/api/servers?hostname=127.0.0.1&port=53");
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).not.toContain("127.0.0.1");
    expect(body).not.toMatch(/"resolvedHost"|"resolvedPort"/);

    const snapshot = JSON.parse(body);
    expect(snapshot.servers.length).toBeGreaterThan(0);
    expect(snapshot).toEqual(await (await get("/api/servers")).json());
    expect(
      snapshot.servers.every((server: { status: string }) => server.status === "polling")
    ).toBe(true);
  });
});

describe("built social cards", () => {
  test("every page points at a card the server renders", async () => {
    for (const path of ["/", "/blog", "/blog/nohorny-4-beta-8"]) {
      const html = await (await get(path)).text();
      const card = /<meta property="og:image" content="https:\/\/xpdustry\.com([^"]+)"/.exec(
        html
      )?.[1];
      expect(card, path).toMatch(/^\/og\/.+\.png$/);

      const response = await get(card!);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("image/png");
      expect(response.headers.get("cache-control")).toContain("max-age=3600");
      expect(new Uint8Array(await response.arrayBuffer()).subarray(1, 4)).toEqual(
        new TextEncoder().encode("PNG")
      );
    }
  });

  test("a locale's pages point at cards in that locale, whatever the visitor prefers", async () => {
    const html = await (await get("/ru/blog")).text();
    expect(html).toContain(
      '<meta property="og:image" content="https://xpdustry.com/ru/og/blog.png"'
    );

    const localized = await get("/ru/og/blog.png");
    expect(localized.status).toBe(200);
    expect(localized.headers.get("content-type")).toBe("image/png");

    const plain = new Uint8Array(await (await get("/og/home.png")).arrayBuffer());
    const preferring = await fetchApp(
      new Request("http://localhost/og/home.png", {
        headers: { "accept-language": "ru", cookie: "generaltranslation.locale=ru" }
      })
    );
    expect(preferring.status).toBe(200);
    expect(new Uint8Array(await preferring.arrayBuffer())).toEqual(plain);
  });

  test("unknown cards are not rendered", async () => {
    expect((await get("/og/blog/no-such-post.png")).status).toBe(404);
    expect((await get("/og/home")).status).toBe(404);
  });
});

describe("what a visitor sends", () => {
  const hostile = {
    cookie:
      "generaltranslation.enable-i18n=false; generaltranslation.locale=ru; generaltranslation.region=US; generaltranslation.reset-locale=true",
    "accept-language": "ru-RU,ru;q=0.9,fr;q=0.8"
  };

  test("cannot change what a shared cache keeps", async () => {
    const shared = [
      "/og/home.png",
      "/fr/og/home.png",
      "/fr/og/blog.png",
      "/ru/og/blog.png",
      "/fr/og/blog/nohorny-4-beta-8.png",
      "/sitemap.xml",
      "/api/servers"
    ];
    // A server of its own renders every card for the hostile request first, the way the first
    // visitor after a restart would, so a poisoned card would be the one it keeps.
    const { origin, stop } = await startProductionServer();
    try {
      for (const path of shared) {
        const poisoned = await fetch(`${origin}${path}`, { headers: hostile });
        const clean = await get(path);
        expect(poisoned.status, path).toBe(200);
        expect(poisoned.headers.get("cache-control"), path).toMatch(/^public\b/);
        for (const response of [poisoned, clean]) {
          expect(response.headers.get("set-cookie"), path).toBeNull();
          expect(response.headers.get("vary") ?? "", path).not.toMatch(/cookie|accept-language/i);
        }
        expect(await digest(poisoned), path).toBe(await digest(clean));
      }
    } finally {
      await stop();
    }
  }, 30_000);

  test.each(["/fr", "/ru/blog", "/fr/blog/nohorny-4-beta-8"])(
    "%s is in the language of its address, whatever cookies say",
    async (path) => {
      const clean = await (await get(path)).text();
      const response = await fetchApp(
        new Request(`https://xpdustry.com${path}`, { headers: hostile })
      );
      expect(response.status).toBe(200);
      const html = await response.text();
      const title = (page: string) => /<title>([^<]*)<\/title>/.exec(page)?.[1];
      expect(title(html)).toBe(title(clean));
      expect(html).toContain(`<html lang="${path.slice(1, 3)}"`);
    }
  );

  test("a link followed within the site to an unprefixed page reads in English", async () => {
    const response = await fetchApp(
      new Request("https://xpdustry.com/blog", {
        headers: {
          "accept-language": "fr-FR,fr;q=0.9",
          cookie: "generaltranslation.locale=fr",
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "navigate"
        }
      })
    );
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('<html lang="en"');
    expect(response.headers.get("set-cookie")).toContain("generaltranslation.locale=en");
  });

  test("the first-visit redirect stays with the visitor it was chosen for", async () => {
    const visitors: Record<string, string>[] = [
      { "accept-language": "fr-FR,fr;q=0.9" },
      { cookie: "generaltranslation.locale=ru" }
    ];
    for (const headers of visitors) {
      const response = await fetchApp(new Request("https://xpdustry.com/blog", { headers }));
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toMatch(/^\/(fr|ru)\/blog$/);
      expect(response.headers.get("cache-control")).toBe("private, no-cache");
      expect(response.headers.get("vary")).toMatch(/accept-language.*cookie/i);
    }
    const english = await get("/");
    expect(english.status).toBe(200);
    expect(english.headers.get("cache-control")).toBe("private, no-cache");
    expect(english.headers.get("vary")).toMatch(/accept-language.*cookie/i);
  });
});
