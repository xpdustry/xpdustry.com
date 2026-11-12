import { createFileRoute } from "@tanstack/react-router";
import { services } from "#app/server/services";

// Liveness only: a server that cannot be reached, or a GitHub outage, does not make the site unhealthy.
export const Route = createFileRoute("/healthz")({
  server: {
    handlers: {
      GET: () => Response.json(services().health, { headers: { "cache-control": "no-store" } }),
    },
  },
});
