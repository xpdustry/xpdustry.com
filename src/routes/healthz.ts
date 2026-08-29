import { getRuntime } from "#app/server/runtime";

// Server reachability does not affect process liveness.
export function GET(): Response {
  return Response.json(getRuntime().health(), {
    headers: { "cache-control": "no-store" },
  });
}
