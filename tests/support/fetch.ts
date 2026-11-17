import { vi, type Mock } from "vitest";

export type Route = (url: URL) => Response | undefined | Promise<Response | undefined>;

export const urlOf = (input: RequestInfo | URL) =>
  new URL(input instanceof Request ? input.url : input);

async function firstAnswer(url: URL, routesInTurn: readonly Route[]): Promise<Response> {
  for (const route of routesInTurn) {
    const response = await route(url);
    if (response) return response;
  }
  return Response.json({ message: "Not Found" }, { status: 404 });
}

export function fakeFetch(...routesInTurn: Route[]): Mock<typeof fetch> {
  return vi.fn<typeof fetch>(async (input, init) => {
    const url = urlOf(input);
    const answer = await firstAnswer(url, routesInTurn);
    init?.signal?.throwIfAborted();
    return answer;
  });
}

export const requestedUrls = (fetchImpl: Mock<typeof fetch>) =>
  fetchImpl.mock.calls.map(([input]) => urlOf(input));
