import { fileURLToPath } from "node:url";
import { serve } from "srvx";
import { compressed } from "./compression.ts";
import { filesFrom } from "./files.ts";

const client = fileURLToPath(new URL("../../dist/client", import.meta.url));
const app: { default: { fetch: (request: Request) => Promise<Response> } } = await import(
  new URL("../../dist/server/server.js", import.meta.url).href
);

serve({
  fetch: async (request) => compressed(request, await app.default.fetch(request)),
  middleware: [filesFrom(client)],
  gracefulShutdown: true
});
