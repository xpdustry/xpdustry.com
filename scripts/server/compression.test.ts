import { brotliDecompressSync, gunzipSync } from "node:zlib";
import { describe, expect, test } from "vitest";
import { compressed, negotiateEncoding } from "./compression.ts";

test.each([
  ["gzip, deflate, br, zstd", "br"],
  ["gzip", "gzip"],
  ["gzip;Q=0.8", "gzip"],
  ["br;q=0.5, gzip", "gzip"],
  ["br;q=0.5, gzip;q=0.5", "br"],
  ["br;q=0, gzip", "gzip"],
  ["*, br;q=0", "gzip"],
  [null, "identity"],
  ["identity", "identity"],
  ["gzip;q=2", "identity"],
  ["gzip;q=0.5, identity", "identity"],
  ["*;q=0", "nothing acceptable"],
  ["identity;q=0, gzip;q=0, br;q=0", "nothing acceptable"]
])("negotiateEncoding gives %j %s", (header, coding) => {
  expect(negotiateEncoding(header)).toBe(coding);
});

describe("compressed", () => {
  const html = "<!doctype html><title>Xpdustry</title>".repeat(50);
  const page = (headers: Record<string, string> = {}) =>
    new Response(html, { headers: { "content-type": "text/html; charset=utf-8", ...headers } });
  const asking = (encoding?: string) =>
    new Request("https://xpdustry.com/", {
      headers: encoding === undefined ? {} : { "accept-encoding": encoding }
    });
  const bytes = async (response: Response) => Buffer.from(await response.arrayBuffer());

  test.each([
    ["gzip", "gzip", gunzipSync],
    ["gzip, br", "br", brotliDecompressSync]
  ])(
    "compresses for %j with the coding it prefers, dropping the stale length",
    async (encoding, coding, decode) => {
      const response = compressed(asking(encoding), page({ "content-length": "1900" }));
      expect(response.headers.get("content-encoding")).toBe(coding);
      expect(response.headers.has("content-length")).toBe(false);
      expect(decode(await bytes(response)).toString()).toBe(html);
    }
  );

  test.each(["identity", undefined, "*;q=0"])(
    "sends %j the body as it is, still varying on the encoding, where it could refuse with 406",
    async (encoding) => {
      const response = compressed(asking(encoding), page());
      expect(response.status).toBe(200);
      expect(response.headers.has("content-encoding")).toBe(false);
      expect(response.headers.get("vary")).toBe("accept-encoding");
      expect((await bytes(response)).toString()).toBe(html);
    }
  );

  test("adds to an existing Vary once", () => {
    const response = compressed(asking("gzip"), page({ vary: "Accept-Encoding, Cookie" }));
    expect(response.headers.get("vary")).toBe("Accept-Encoding, Cookie");
    expect(compressed(asking("gzip"), page({ vary: "cookie" })).headers.get("vary")).toBe(
      "cookie, accept-encoding"
    );
  });

  test("varies a bodiless response without encoding it", () => {
    const response = compressed(
      asking("gzip"),
      new Response(null, { status: 304, headers: { "content-type": "text/html" } })
    );
    expect(response.status).toBe(304);
    expect(response.headers.has("content-encoding")).toBe(false);
    expect(response.headers.get("vary")).toBe("accept-encoding");
  });

  test.each([
    ["an image", new Response("png", { headers: { "content-type": "image/png" } })],
    [
      "an encoded body",
      new Response("x", { headers: { "content-type": "text/plain", "content-encoding": "br" } })
    ]
  ])("leaves %s alone", (_, response) => {
    expect(compressed(asking("gzip"), response)).toBe(response);
  });
});
