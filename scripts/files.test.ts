import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { brotliCompressSync, gunzipSync } from "node:zlib";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { filesFrom } from "./files.ts";

const SCRIPT = "export const greeting = 'hello';\n".repeat(100);
const PRECOMPRESSED = brotliCompressSync(SCRIPT);

let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "xpdustry-files-"));
  await mkdir(join(dir, "assets"));
  await writeFile(join(dir, "assets", "app.js"), SCRIPT);
  await writeFile(join(dir, "assets", "app.js.br"), PRECOMPRESSED);
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

const notFound = () => new Response("not a file", { status: 404 });

async function fetchAsset(acceptEncoding: string) {
  const request = new Request("http://127.0.0.1/assets/app.js", {
    headers: { "accept-encoding": acceptEncoding }
  });
  const response = await filesFrom(dir)(request, notFound);
  return {
    encoding: response.headers.get("content-encoding"),
    vary: response.headers.get("vary"),
    body: Buffer.from(await response.arrayBuffer())
  };
}

describe("files from disk", () => {
  test.each([
    ["br;Q=0, gzip;q=0", "Brotli and gzip are refused, upper case Q or not"],
    ["*;q=0", "nothing is acceptable, where it could refuse with 406"]
  ])("sends %j the file as it is: %s", async (header) => {
    const { encoding, body, vary } = await fetchAsset(header);

    expect(encoding).toBeNull();
    expect(body.toString()).toBe(SCRIPT);
    expect(vary).toMatch(/accept-encoding/i);
  });

  test("sends gzip to a request that ranks it above Brotli", async () => {
    const { encoding, body } = await fetchAsset("br;q=0.1, gzip;q=1, identity;q=0");

    expect(encoding).toBe("gzip");
    expect(gunzipSync(body).toString()).toBe(SCRIPT);
  });

  test("sends the precompressed Brotli file to a request that prefers Brotli", async () => {
    const { encoding, body } = await fetchAsset("gzip, deflate, br, zstd");

    expect(encoding).toBe("br");
    expect(body).toEqual(PRECOMPRESSED);
  });
});
