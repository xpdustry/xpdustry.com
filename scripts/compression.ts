import { Readable, type Transform } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { constants, createBrotliCompress, createGzip } from "node:zlib";

const STREAMING_BROTLI_QUALITY = 5;

const COMPRESSORS: Record<Coding, () => Transform> = {
  br: () =>
    createBrotliCompress({
      flush: constants.BROTLI_OPERATION_FLUSH,
      params: { [constants.BROTLI_PARAM_QUALITY]: STREAMING_BROTLI_QUALITY }
    }),
  gzip: () => createGzip({ flush: constants.Z_SYNC_FLUSH })
};

const CODINGS_BY_PREFERENCE = ["br", "gzip"] as const;
type Coding = (typeof CODINGS_BY_PREFERENCE)[number];

const COMPRESSIBLE = /^(text\/|application\/(json|javascript|xml))/;
const REFUSED = 0;
const QVALUE = /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/;

function weightByCoding(header: string): Map<string, number> {
  const found = new Map<string, number>();
  for (const entry of header.split(",")) {
    const [name = "", ...params] = entry.split(";").map((part) => part.trim());
    if (!name || found.has(name.toLowerCase())) continue;
    let weight = 1;
    for (const param of params) {
      const [key = "", value = ""] = param.split("=").map((part) => part.trim());
      if (key.toLowerCase() === "q") weight = QVALUE.test(value) ? Number(value) : REFUSED;
    }
    found.set(name.toLowerCase(), weight);
  }
  return found;
}

// https://www.rfc-editor.org/rfc/rfc9110#section-12.5.3
export function negotiateEncoding(header: string | null): Coding | undefined {
  if (!header) return undefined;
  const named = weightByCoding(header);
  const weightOf = (name: string) => named.get(name) ?? named.get("*") ?? REFUSED;
  let best: Coding | undefined;
  for (const coding of CODINGS_BY_PREFERENCE) {
    if (weightOf(coding) > (best ? weightOf(best) : REFUSED)) best = coding;
  }
  if (best && (named.get("identity") ?? REFUSED) > weightOf(best)) return undefined;
  return best;
}

function addVary(headers: Headers, field: string) {
  const fields = (headers.get("vary") ?? "").split(",").map((name) => name.trim().toLowerCase());
  if (!fields.includes("*") && !fields.includes(field)) headers.append("vary", field);
}

export function compressed(request: Request, response: Response): Response {
  const type = response.headers.get("content-type") ?? "";
  if (response.headers.has("content-encoding") || !COMPRESSIBLE.test(type)) return response;

  const headers = new Headers(response.headers);
  addVary(headers, "accept-encoding");
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
