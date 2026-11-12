import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { fileURLToPath } from "node:url";
import { constants, createBrotliCompress, createGzip } from "node:zlib";
import { serve, type ServerMiddleware } from "srvx";
import { staticMiddleware } from "srvx/static";

const client = fileURLToPath(new URL("../dist/client", import.meta.url));
const app: { default: { fetch: (request: Request) => Promise<Response> } } = await import(
  new URL("../dist/server/server.js", import.meta.url).href
);

const assets = staticMiddleware({ dir: client, maxAge: 31_536_000, immutable: true });
const files = staticMiddleware({ dir: client, maxAge: 3600 });
const fromDisk: ServerMiddleware = (request, next) =>
  new URL(request.url).pathname.startsWith("/assets/")
    ? assets(request, next)
    : files(request, next);

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
  middleware: [fromDisk],
  gracefulShutdown: true,
});
