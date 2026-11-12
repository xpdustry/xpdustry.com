import { brotliDecompressSync, gunzipSync } from "node:zlib";
import { describe, expect, test } from "vitest";
import { compressed, negotiateEncoding } from "./compression.ts";

describe("negotiateEncoding", () => {
  test.each([
    ["gzip, deflate, br, zstd", "br"],
    ["gzip", "gzip"],
    ["GZIP", "gzip"],
    ["gzip;Q=0.8", "gzip"],
    ["br;q=0.5, gzip", "gzip"],
    ["br;q=0.5, gzip;q=0.5", "br"],
    ["br;q=0, gzip", "gzip"],
    ["gzip ; q=0.001", "gzip"],
    ["*", "br"],
    ["*, br;q=0", "gzip"],
    ["deflate, *;q=0.1", "br"],
    ["gzip;q=0.5, identity;q=0.4", "gzip"]
  ])("%j gets %s", (header, coding) => {
    expect(negotiateEncoding(header)).toBe(coding);
  });

  test.each([
    null,
    "",
    "identity",
    "gzip;q=0",
    "gzip;q=0.000",
    "br;q=0,gzip;q=0",
    "*;q=0",
    "abracadabra",
    "deflate, zstd",
    "gzip;q=2",
    "gzip;q=-1",
    "gzip;q=0.5000",
    "gzip;q=yes",
    "gzip;q=0.5, identity",
    "gzip;q=0, gzip"
  ])("%j gets the body as it is", (header) => {
    expect(negotiateEncoding(header)).toBeUndefined();
  });
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

  test("compresses with the coding the request prefers", async () => {
    const gzip = compressed(asking("gzip"), page({ "content-length": "1900" }));
    expect(gzip.headers.get("content-encoding")).toBe("gzip");
    expect(gzip.headers.has("content-length")).toBe(false);
    expect(gunzipSync(await bytes(gzip)).toString()).toBe(html);

    const br = compressed(asking("gzip, br"), page());
    expect(br.headers.get("content-encoding")).toBe("br");
    expect(brotliDecompressSync(await bytes(br)).toString()).toBe(html);
  });

  test.each(["gzip;q=0", "identity", "abracadabra", undefined])(
    "sends %j the body as it is, still varying on the encoding",
    async (encoding) => {
      const response = compressed(asking(encoding), page());
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
