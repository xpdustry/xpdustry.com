// A parser-inserted script waits for every stylesheet before it to load:
// https://html.spec.whatwg.org/multipage/semantics.html#has-a-style-sheet-that-is-blocking-scripts
// Past the viewport, the charset declaration stays in the first 1024 bytes the browser prescans:
// https://html.spec.whatwg.org/multipage/parsing.html#prescan-a-byte-stream-to-determine-its-encoding
const VIEWPORT = /<meta name="viewport"[^>]*>/;
const STYLESHEET = /<link rel="stylesheet"/;

function scriptPosition(head: string): number | undefined {
  const viewport = VIEWPORT.exec(head);
  const afterViewport = viewport ? viewport.index + viewport[0].length : undefined;
  const beforeStylesheets = STYLESHEET.exec(head)?.index;
  if (afterViewport === undefined) return beforeStylesheets;
  if (beforeStylesheets === undefined) return afterViewport;
  return Math.min(afterViewport, beforeStylesheets);
}

const HEAD_SEARCH_CHARS = 16_384;

export function withHeadScript(response: Response, script: string): Response {
  const type = response.headers.get("content-type") ?? "";
  if (!response.body || !type.startsWith("text/html")) return response;

  // Redact 0.3 hydrates head scripts by `src` and `type` alone (`HEAD_KEY_ATTRS`): the type keeps
  // the shell's untyped scripts from claiming this one.
  const tag = `<script type="text/javascript">${script}</script>`;
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let held = "";
  let placed = false;
  const body = response.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        if (placed) return controller.enqueue(chunk);
        held += decoder.decode(chunk, { stream: true });
        const at = scriptPosition(held);
        if (at !== undefined) held = held.slice(0, at) + tag + held.slice(at);
        if (at === undefined && held.length < HEAD_SEARCH_CHARS) return;
        placed = true;
        controller.enqueue(encoder.encode(held));
      },
      flush(controller) {
        if (!placed) controller.enqueue(encoder.encode(held + decoder.decode()));
      }
    })
  );
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(body, { status: response.status, statusText: response.statusText, headers });
}
