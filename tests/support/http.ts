import { request } from "node:http";

const BODYLESS = new Set([101, 204, 205, 304]);

/** Not `fetch`, which adds its own `accept-language`, `accept-encoding` and `sec-fetch-mode`, and decodes the body. */
export function httpGet(
  url: string,
  headers: Record<string, string> = {},
  method: "GET" | "HEAD" = "GET"
): Promise<Response> {
  return new Promise((resolve, reject) => {
    request(url, { headers, method }, (answer) => {
      const chunks: Buffer[] = [];
      answer.on("data", (chunk: Buffer) => chunks.push(chunk));
      answer.on("end", () => {
        const received = new Headers();
        for (const [name, value] of Object.entries(answer.headers)) {
          for (const each of [value ?? []].flat()) received.append(name, each);
        }
        const status = answer.statusCode!;
        const body = BODYLESS.has(status) || method === "HEAD" ? null : Buffer.concat(chunks);
        resolve(new Response(body, { status, headers: received }));
      });
      answer.on("error", reject);
    })
      .on("error", reject)
      .end();
  });
}
