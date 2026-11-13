import { createFileRoute } from "@tanstack/react-router";
import logo from "#app/brand/logo.svg?raw";

/** The logo at a stable URL, for other sites to link to. */
export const Route = createFileRoute("/logo.svg")({
  server: {
    handlers: {
      GET: () =>
        new Response(logo, {
          headers: {
            "content-type": "image/svg+xml",
            "cache-control": "public, max-age=3600",
            "access-control-allow-origin": "*"
          }
        })
    }
  }
});
