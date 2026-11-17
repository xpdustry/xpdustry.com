import { fileURLToPath } from "node:url";
import { serve, type ServerMiddleware } from "srvx";
import { staticMiddleware } from "srvx/static";
import { compressed } from "./compression.ts";

const client = fileURLToPath(new URL("../dist/client", import.meta.url));
const app: { default: { fetch: (request: Request) => Promise<Response> } } = await import(
  new URL("../dist/server/server.js", import.meta.url).href
);

const YEAR_S = 365 * 24 * 60 * 60;
const HOUR_S = 60 * 60;
const precompressed = { br: ".br" };
const assets = staticMiddleware({
  dir: client,
  maxAge: YEAR_S,
  immutable: true,
  encodings: precompressed
});
const files = staticMiddleware({ dir: client, maxAge: HOUR_S, encodings: precompressed });
const fromDisk: ServerMiddleware = (request, next) =>
  new URL(request.url).pathname.startsWith("/assets/")
    ? assets(request, next)
    : files(request, next);

serve({
  fetch: async (request) => compressed(request, await app.default.fetch(request)),
  middleware: [fromDisk],
  gracefulShutdown: true
});
