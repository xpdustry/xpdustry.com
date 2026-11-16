/**
 * Puts a script at the top of a page's head, ahead of its stylesheets. A script further down only
 * runs once the stylesheets before it have loaded, so what must start with the page's first bytes
 * is written into the response here instead.
 *
 * It goes right after the viewport, so the character set stays within the bytes a browser reads
 * for it: or right before the first stylesheet, when the renderer has put those first. A response
 * that is not a page, or whose head never shows up, is left as it is.
 */
const VIEWPORT = /<meta name="viewport"[^>]*>/;
const STYLESHEET = /<link rel="stylesheet"/;

/** Where in `head` the script goes, once that can be told. */
function place(head: string): number | undefined {
  const viewport = VIEWPORT.exec(head);
  const after = viewport ? viewport.index + viewport[0].length : undefined;
  const sheet = STYLESHEET.exec(head)?.index;
  if (sheet !== undefined && (after === undefined || sheet < after)) return sheet;
  return after;
}

/** A head that has not shown up within this many characters is not coming. */
const FAR_ENOUGH = 16_384;

export function withHeadScript(response: Response, script: string): Response {
  const type = response.headers.get("content-type") ?? "";
  if (!response.body || !type.startsWith("text/html")) return response;

  // Redact identifies head scripts by src/type, ignoring id and content. Give this server-only
  // script a distinct signature so it cannot be claimed by the shell's untyped inline scripts.
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
        const at = place(held);
        if (at !== undefined) held = held.slice(0, at) + tag + held.slice(at);
        if (at === undefined && held.length < FAR_ENOUGH) return;
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
