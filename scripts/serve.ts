import { fileURLToPath } from "node:url";
import { serve, type ServerMiddleware } from "srvx";
import { staticMiddleware } from "srvx/static";
import { compressed } from "./compression.ts";

const client = fileURLToPath(new URL("../dist/client", import.meta.url));
const app: { default: { fetch: (request: Request) => Promise<Response> } } = await import(
  new URL("../dist/server/server.js", import.meta.url).href
);

/** What `precompress.ts` compressed at build time is sent as it is; the rest is compressed here. */
const encodings = { br: ".br" };
const assets = staticMiddleware({ dir: client, maxAge: 31_536_000, immutable: true, encodings });
const files = staticMiddleware({ dir: client, maxAge: 3600, encodings });
const fromDisk: ServerMiddleware = (request, next) =>
  new URL(request.url).pathname.startsWith("/assets/")
    ? assets(request, next)
    : files(request, next);

serve({
  fetch: async (request) => compressed(request, await app.default.fetch(request)),
  middleware: [fromDisk],
  gracefulShutdown: true
});
