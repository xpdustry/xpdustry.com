import { readServerSnapshot } from "#app/server/runtime";

// Never accept query-supplied endpoints; that would turn this route into a UDP relay.
export function GET(): Response {
  return Response.json(readServerSnapshot(), {
    headers: {
      "cache-control": "public, max-age=15, stale-while-revalidate=30",
    },
  });
}
