// Serves the production build: the files in dist/client, then everything else through the app.
// Listens on PORT (3000 by default) and drains open requests on SIGINT and SIGTERM.

import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { fileURLToPath } from "node:url";
import { constants, createBrotliCompress, createGzip } from "node:zlib";
import { serve, type ServerMiddleware } from "srvx";
import { staticMiddleware } from "srvx/static";
import { requestRedirect } from "../src/server/redirects.ts";

const client = fileURLToPath(new URL("../dist/client", import.meta.url));
const app: { default: { fetch: (request: Request) => Promise<Response> } } = await import(
  new URL("../dist/server/server.js", import.meta.url).href
);

// Vite fingerprints everything under /assets, so it never changes; the rest (icons, post media,
// robots.txt) may, so it is kept for an hour.
const assets = staticMiddleware({ dir: client, maxAge: 31_536_000, immutable: true });
const files = staticMiddleware({ dir: client, maxAge: 3600 });
const fromDisk: ServerMiddleware = (request, next) =>
  new URL(request.url).pathname.startsWith("/assets/")
    ? assets(request, next)
    : files(request, next);

// The files are compressed by `staticMiddleware`; the app's pages here, as they stream, each chunk
// flushed so the browser can start on the head while the rest renders.
const COMPRESSIBLE = /^(text\/|application\/(json|javascript|xml))/;
const compressors = {
  br: () =>
    createBrotliCompress({
      flush: constants.BROTLI_OPERATION_FLUSH,
      params: { [constants.BROTLI_PARAM_QUALITY]: 5 },
    }),
  gzip: () => createGzip({ flush: constants.Z_SYNC_FLUSH }),
};

function compressed(request: Request, response: Response): Response {
  const type = response.headers.get("content-type") ?? "";
  if (!response.body || response.headers.has("content-encoding") || !COMPRESSIBLE.test(type)) {
    return response;
  }
  const accepted = request.headers.get("accept-encoding") ?? "";
  const encoding = (["br", "gzip"] as const).find((name) => accepted.includes(name));
  if (!encoding) return response;

  const headers = new Headers(response.headers);
  headers.set("content-encoding", encoding);
  headers.delete("content-length");
  headers.append("vary", "accept-encoding");
  const body = Readable.fromWeb(response.body as NodeReadableStream).pipe(compressors[encoding]());
  return new Response(Readable.toWeb(body) as ReadableStream, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

serve({
  fetch: async (request) => compressed(request, await app.default.fetch(request)),
  middleware: [(request, next) => requestRedirect(request) ?? next(), fromDisk],
  gracefulShutdown: true,
});
