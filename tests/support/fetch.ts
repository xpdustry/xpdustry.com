import { vi, type Mock } from "vitest";

export type Route = (url: URL) => Response | undefined;

const urlOf = (input: RequestInfo | URL) => new URL(input instanceof Request ? input.url : input);

export function fakeFetch(...routesInTurn: Route[]): Mock<typeof fetch> {
  return vi.fn<typeof fetch>(async (input) => {
    const url = urlOf(input);
    for (const route of routesInTurn) {
      const response = route(url);
      if (response) return response;
    }
    return Response.json({ message: "Not Found" }, { status: 404 });
  });
}

export const pathsOn =
  (host: string, paths: Record<string, () => Response>): Route =>
  (url) =>
    url.host === host ? paths[url.pathname]?.() : undefined;

export const requestedUrls = (fetchImpl: Mock<typeof fetch>) =>
  fetchImpl.mock.calls.map(([input]) => urlOf(input));
