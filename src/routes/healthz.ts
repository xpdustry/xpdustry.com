import { getRuntime } from "#app/server/runtime";

/**
 * 200 whenever the process can answer a request.
 *
 * A GitHub outage or a dead game server is degradation, not death: the
 * snapshot states in the body say so, and an orchestrator that restarted the
 * container over an upstream failure would only make the site less available.
 */
export function GET(): Response {
  return Response.json(getRuntime().health(), {
    headers: { "cache-control": "no-store" },
  });
}
