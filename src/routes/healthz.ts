import { createFileRoute } from "@tanstack/react-router";
import { services } from "#app/server/services";

export const Route = createFileRoute("/healthz")({
  server: {
    handlers: {
      GET: () => Response.json(services().health, { headers: { "cache-control": "no-store" } })
    }
  }
});
