/**
 * The production entry: a plain Node HTTP server around the SSR handler.
 *
 * It is bundled into the same module graph as the handler, so the pollers
 * started here are the same instances the renderer and the API routes read.
 * A separate process-level script importing the built bundle would get its
 * own copy of every module and poll twice.
 */

import { createReadStream, statSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { handleRequest } from "virtual:solid-ssr-handler";
import { getRuntime, readConfig, stopRuntime } from "#app/server/runtime";

/** How long in-flight responses get to finish after a shutdown signal. */
const DRAIN_TIMEOUT_MS = 5000;

const CLIENT_ROOT = resolve(import.meta.dirname, "../client");

const MIME_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webm": "video/webm",
  ".webmanifest": "application/manifest+json",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const config = readConfig();

// Both pollers run their first cycle before the listener opens; requests that
// arrive before it lands render the explicit loading state rather than waiting.
const runtime = getRuntime();

const server = createServer((req, res) => {
  void handle(req, res).catch((error) => {
    console.error("[http] request failed", error);
    if (!res.headersSent) res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end("Internal Server Error");
  });
});

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (await serveStatic(req, res)) return;
  const response = await handleRequest(toWebRequest(req));
  await sendWebResponse(res, response);
}

/**
 * Serves the built client assets. Only paths that stay inside `dist/client`
 * after normalization are considered, so `..` in a URL cannot walk out of it.
 */
async function serveStatic(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  if (req.method !== "GET" && req.method !== "HEAD") return false;

  const pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  if (pathname === "/" || pathname.endsWith("/")) return false;

  const target = join(CLIENT_ROOT, normalize(pathname));
  if (target !== CLIENT_ROOT && !target.startsWith(CLIENT_ROOT + sep)) return false;

  let stats;
  try {
    stats = statSync(target);
  } catch {
    return false;
  }
  if (!stats.isFile()) return false;

  const extension = extname(target).toLowerCase();
  res.writeHead(200, {
    "content-type": MIME_TYPES[extension] ?? "application/octet-stream",
    "content-length": stats.size,
    // Vite fingerprints everything under /assets, so those are immutable.
    // The rest (favicon, fonts copied verbatim, post media) is not.
    "cache-control": pathname.startsWith("/assets/")
      ? "public, max-age=31536000, immutable"
      : "public, max-age=3600",
  });

  if (req.method === "HEAD") {
    res.end();
    return true;
  }

  try {
    await pipeline(createReadStream(target), res);
  } catch (error) {
    console.error("[http] static read failed", error);
    if (!res.destroyed) res.destroy();
  }
  return true;
}

function toWebRequest(req: IncomingMessage): Request {
  const host = req.headers.host ?? `localhost:${config.port}`;
  const url = new URL(req.url ?? "/", `http://${host}`);

  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) value.forEach((entry) => headers.append(name, entry));
    else headers.set(name, value);
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  return new Request(url, {
    method: req.method,
    headers,
    body: hasBody ? (Readable.toWeb(req) as ReadableStream<Uint8Array>) : undefined,
    // Node streams are not duplex-capable; this is required for a body.
    ...(hasBody ? { duplex: "half" } : {}),
  } as RequestInit);
}

async function sendWebResponse(res: ServerResponse, response: Response): Promise<void> {
  res.writeHead(response.status, Object.fromEntries(response.headers));
  if (!response.body) {
    res.end();
    return;
  }
  await Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]).pipe(res);
}

server.listen(config.port, "0.0.0.0", () => {
  console.log(`[http] listening on http://0.0.0.0:${config.port}`);
});

let shuttingDown = false;

function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[http] ${signal} received, draining`);

  // Stop accepting connections first, then let the pollers go: a cycle that
  // finishes during the drain is harmless, one that starts is not.
  server.close(() => {
    runtime.stop();
    stopRuntime();
    process.exit(0);
  });
  server.closeIdleConnections();

  setTimeout(() => {
    console.warn("[http] drain timed out, exiting anyway");
    runtime.stop();
    stopRuntime();
    process.exit(0);
  }, DRAIN_TIMEOUT_MS).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
