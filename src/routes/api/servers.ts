import { createFileRoute } from "@tanstack/react-router";
import { services } from "#app/status/server/services";

export const Route = createFileRoute("/api/servers")({
  server: {
    handlers: {
      GET: () =>
        Response.json(services().servers, {
          headers: { "cache-control": "public, max-age=15, stale-while-revalidate=30" }
        })
    }
  }
});
