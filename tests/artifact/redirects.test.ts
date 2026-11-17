import { expect, test } from "vitest";
import { LEGACY_MEDIA_REDIRECTS } from "#app/seo/server/redirects.ts";
import { get, head } from "#tests/support/served.ts";

/** The previous site's files that stay where they were; the map holds the ones that moved. */
const PREVIOUS_SITE_FILES = [
  "/apple-touch-icon.png",
  "/blog/nohorny-showcase.mp4",
  "/favicon.ico",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/phinner.svg",
  "/robots.txt",
  "/site.webmanifest"
];
const QUERY = "?q=a%20b&tag=one&tag=two";

test.for(PREVIOUS_SITE_FILES)("%s from the previous site still answers", async (path) => {
  expect((await get(path + QUERY)).status).toBe(200);
});

// Every entry of the map, so a new one is checked without anyone listing it here.
test.for([...LEGACY_MEDIA_REDIRECTS])(
  "%s moves for good to %s, which answers, keeping its query",
  async ([from, to]) => {
    const response = await get(from + QUERY);
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(to + QUERY);
    expect((await get(to)).status).toBe(200);
  }
);

/**
 * Site policy: a HEAD answers with its GET's status and these headers. RFC 9110 lets a server
 * leave out what only making the content decides: https://www.rfc-editor.org/rfc/rfc9110#section-9.3.2
 */
const HEAD_KEEPS = ["content-type", "content-length", "location", "cache-control"];
// One path per handler: a static file, a route, a moved file, a page, a translated page, a 404,
// and a trailing slash.
test.for(["/icon-192.png", "/logo.svg", "/og.png", "/", "/fr/blog", "/no-such-page", "/blog/"])(
  "a HEAD for %s answers as its GET does",
  async (path) => {
    const [answer, asked] = [await get(path + QUERY), await head(path + QUERY)];
    expect(asked.status).toBe(answer.status);
    for (const name of HEAD_KEEPS) {
      expect(asked.headers.get(name), name).toBe(answer.headers.get(name));
    }
  }
);

test.for(["/blog/", "/blog/nohorny-4-beta-8/", "/fr/blog/"])(
  "%s drops its trailing slash for good and keeps its query",
  async (path) => {
    const response = await get(path + QUERY);
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(path.slice(0, -1) + QUERY);
  }
);

test("an unknown image is not given a replacement", async () => {
  expect((await get("/blog/missing.png")).status).toBe(404);
});
