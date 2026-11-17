import { readdir, readFile, stat } from "node:fs/promises";
import { brotliDecompressSync, gunzipSync } from "node:zlib";
import { expect, test } from "vitest";
import { get, html } from "#tests/support/served.ts";

const assets = new URL("../../dist/client/assets/", import.meta.url);

test("the logo has an address that does not change", async () => {
  const response = await get("/logo.svg");
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("image/svg+xml");
  expect(await response.text()).toBe(
    await readFile(new URL("../../src/brand/logo.svg", import.meta.url), "utf8")
  );
});

test("the painter starts ahead of the stylesheets, with its labyrinth inside its worker", async () => {
  const home = await html("/");
  const painters = [...home.matchAll(/<script type="text\/javascript">\(function painter\(/g)];
  expect(painters).toHaveLength(1);
  expect(painters[0]!.index).toBeLessThan(home.indexOf('rel="stylesheet"'));

  const worker = /data-painter="(\/assets\/painter\.worker-[^"]+\.js)"/.exec(home)?.[1];
  expect(worker, "the page names the painter's worker").toBeDefined();
  const script = await get(worker!);
  expect(script.status).toBe(200);
  expect(script.headers.get("content-type")).toMatch(/javascript/);
  expect(await script.text()).toContain("data:image/avif;base64,");
  expect(home).not.toMatch(/labyrinth-[^"]*\.avif/);
});

const decode = { br: brotliDecompressSync, gzip: gunzipSync, identity: (sent: Buffer) => sent };

test.for([
  ["gzip, br", "br"],
  ["br;Q=0, gzip;q=0", "identity"],
  ["br;q=0.1, gzip;q=1, identity;q=0", "gzip"]
] as const)(
  "a built script with a Brotli copy, asked for with %j, is sent %s",
  async ([accepted, coding]) => {
    const brotli = (await readdir(assets)).find((file) => file.endsWith(".js.br"))!;
    const script = await get(`/assets/${brotli.slice(0, -3)}`, { "accept-encoding": accepted });
    expect(script.headers.get("content-encoding") ?? "identity").toBe(coding);
    expect(script.headers.get("content-type")).toMatch(/javascript/);
    expect(script.headers.get("vary")).toMatch(/accept-encoding/i);
    if (coding === "br") {
      // The copy compressed at build time, as it is.
      expect(script.headers.get("content-length")).toBe(
        String((await stat(new URL(brotli, assets))).size)
      );
    }
    expect(decode[coding](Buffer.from(await script.arrayBuffer())).toString()).toBe(
      await readFile(new URL(brotli.slice(0, -3), assets), "utf8")
    );
  }
);

test.for([
  ["gzip;q=0", null],
  ["identity", null],
  ["br;q=0.5, gzip", "gzip"]
] as const)("a page asked for with %j is sent %s", async ([accepted, coding]) => {
  const page = await get("/", { "accept-encoding": accepted });
  expect(page.headers.get("content-encoding")).toBe(coding);
  expect(page.headers.get("vary")).toMatch(/accept-encoding/i);
  const sent = Buffer.from(await page.arrayBuffer());
  expect((coding === "gzip" ? gunzipSync(sent) : sent).toString()).toContain("<title>Xpdustry");
});
