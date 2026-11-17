import type { ServerMiddleware } from "srvx";
import { staticMiddleware } from "srvx/static";
import { encodingFor } from "./compression.ts";

const YEAR_S = 365 * 24 * 60 * 60;
const HOUR_S = 60 * 60;
const PRECOMPRESSED = { br: ".br" };

function askingOnlyForOurChoice(request: Request): Request {
  const headers = new Headers(request.headers);
  headers.set("accept-encoding", encodingFor(request));
  return new Request(request.url, { method: request.method, headers });
}

export function filesFrom(dir: string): ServerMiddleware {
  const assets = staticMiddleware({
    dir,
    maxAge: YEAR_S,
    immutable: true,
    encodings: PRECOMPRESSED
  });
  const files = staticMiddleware({ dir, maxAge: HOUR_S, encodings: PRECOMPRESSED });
  return (request, next) => {
    const negotiated = askingOnlyForOurChoice(request);
    return new URL(request.url).pathname.startsWith("/assets/")
      ? assets(negotiated, next)
      : files(negotiated, next);
  };
}
