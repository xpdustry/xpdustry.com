import { readServerSnapshot } from "#app/server/runtime";

/**
 * The current server snapshot, for the hardcoded alias list and nothing else.
 * There is deliberately no parameter here: a host or port taken from the query
 * string would make this endpoint a way to aim UDP traffic at any address.
 */
export function GET(): Response {
  return Response.json(readServerSnapshot(), {
    headers: {
      "cache-control": "public, max-age=15, stale-while-revalidate=30",
    },
  });
}
