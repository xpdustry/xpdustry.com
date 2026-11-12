import { Readable, type Transform } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { constants, createBrotliCompress, createGzip } from "node:zlib";

const COMPRESSORS: Record<Coding, () => Transform> = {
  br: () =>
    createBrotliCompress({
      flush: constants.BROTLI_OPERATION_FLUSH,
      params: { [constants.BROTLI_PARAM_QUALITY]: 5 }
    }),
  gzip: () => createGzip({ flush: constants.Z_SYNC_FLUSH })
};

/** The codings the server produces, in the order it prefers them when the client has no preference. */
const CODINGS = ["br", "gzip"] as const;
type Coding = (typeof CODINGS)[number];

const COMPRESSIBLE = /^(text\/|application\/(json|javascript|xml))/;
const QVALUE = /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/;

/** Each coding an `Accept-Encoding` header names, with its weight. The first mention of a coding counts. */
function weights(header: string): Map<string, number> {
  const found = new Map<string, number>();
  for (const entry of header.split(",")) {
    const [name = "", ...params] = entry.split(";").map((part) => part.trim());
    if (!name || found.has(name.toLowerCase())) continue;
    let weight = 1;
    for (const param of params) {
      const [key = "", value = ""] = param.split("=").map((part) => part.trim());
      // A malformed weight makes the entry unusable rather than a guess.
      if (key.toLowerCase() === "q") weight = QVALUE.test(value) ? Number(value) : 0;
    }
    found.set(name.toLowerCase(), weight);
  }
  return found;
}

/**
 * The coding to send for a request's `Accept-Encoding` (RFC 9110, section 12.5.3), or undefined to
 * send the body as it is. A coding weighted 0 is refused, a coding the header does not name takes
 * the weight of `*` or is refused when there is none, and the heaviest coding wins, ties going to
 * the server's order. Identity wins only when the header names it with a greater weight.
 */
export function negotiateEncoding(header: string | null): Coding | undefined {
  if (!header) return undefined;
  const named = weights(header);
  const weightOf = (name: string) => named.get(name) ?? named.get("*") ?? 0;
  let best: Coding | undefined;
  for (const coding of CODINGS) {
    if (weightOf(coding) > (best ? weightOf(best) : 0)) best = coding;
  }
  if (best && (named.get("identity") ?? 0) > weightOf(best)) return undefined;
  return best;
}

/** Adds a field to `Vary` unless it is already there. */
function vary(headers: Headers, field: string) {
  const fields = (headers.get("vary") ?? "").split(",").map((name) => name.trim().toLowerCase());
  if (!fields.includes("*") && !fields.includes(field)) headers.append("vary", field);
}

/**
 * The response compressed as the request accepts. A response that could be compressed says it
 * varies on `Accept-Encoding` whether or not it was, so a shared cache keeps the variants apart.
 */
export function compressed(request: Request, response: Response): Response {
  const type = response.headers.get("content-type") ?? "";
  if (response.headers.has("content-encoding") || !COMPRESSIBLE.test(type)) return response;

  const headers = new Headers(response.headers);
  vary(headers, "accept-encoding");
  const encoding = negotiateEncoding(request.headers.get("accept-encoding"));
  let body = response.body;
  if (encoding && body) {
    headers.set("content-encoding", encoding);
    headers.delete("content-length");
    const stream = Readable.fromWeb(body as NodeReadableStream).pipe(COMPRESSORS[encoding]());
    body = Readable.toWeb(stream) as ReadableStream;
  }
  return new Response(body, { status: response.status, statusText: response.statusText, headers });
}
