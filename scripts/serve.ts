// Serves the production build: the files in dist/client, then everything else through the app.
// Listens on PORT (3000 by default) and drains open requests on SIGINT and SIGTERM.

import { fileURLToPath } from "node:url";
import { serve, type ServerMiddleware } from "srvx";
import { staticMiddleware } from "srvx/static";

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

serve({
  fetch: (request) => app.default.fetch(request),
  middleware: [fromDisk],
  gracefulShutdown: true,
});
