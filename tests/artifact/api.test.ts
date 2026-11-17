import { readdir, readFile } from "node:fs/promises";
import { expect, test } from "vitest";
import { get, origin } from "#tests/support/served.ts";

const sameOrigin = { origin, "sec-fetch-site": "same-origin" };

test("health reports liveness without giving away internals", async () => {
  const response = await get("/healthz");
  const body = await response.text();
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(JSON.parse(body)).toMatchObject({ status: "ok" });
  expect(body).not.toMatch(/token|Bearer|_mindustry\._tcp|\.internal|at .*\.js:\d+/i);
});

test.for(["unknown", "__proto__", "constructor", "", "unknown?payload=garbage"])(
  "server function %j is a plain 404",
  async (id) => {
    const response = await get(`/_serverFn/${id}`, sameOrigin);
    expect(response.status).toBe(404);
    expect(response.headers.has("set-cookie")).toBe(false);
    expect(await response.text()).toBe("Not Found");
  }
);

test("every server function the build defines answers", async () => {
  const assets = new URL("../../dist/server/assets/", import.meta.url);
  const ids: string[] = [];
  for (const file of (await readdir(assets)).filter((name) => name.endsWith(".js"))) {
    const code = await readFile(new URL(file, assets), "utf8");
    ids.push(...[...code.matchAll(/createServerRpc\(\{\s*id: "(\w+)"/g)].map(([, id]) => id!));
  }
  expect(ids.length).toBeGreaterThan(0);
  for (const id of ids) expect((await get(`/_serverFn/${id}`, sameOrigin)).status, id).toBe(200);
});

test("server status ignores targets in the request and hides the addresses it resolved", async () => {
  const response = await get("/api/servers?hostname=127.0.0.1&port=53");
  const body = await response.text();
  expect(response.status).toBe(200);
  expect(body).not.toContain("127.0.0.1");
  expect(body).not.toMatch(/"resolvedHost"|"resolvedPort"/);

  const snapshot = JSON.parse(body) as { servers: { status: string }[] };
  expect(snapshot.servers.length).toBeGreaterThan(0);
  expect(snapshot).toEqual(await (await get("/api/servers")).json());
  expect(snapshot.servers.every((server) => server.status === "polling")).toBe(true);
});
