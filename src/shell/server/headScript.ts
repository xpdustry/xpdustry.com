// A parser-inserted script waits for every stylesheet before it to load:
// https://html.spec.whatwg.org/multipage/semantics.html#has-a-style-sheet-that-is-blocking-scripts
// The charset declaration must end within the first 1024 bytes, and Redact 0.3 writes its hints
// first in the head (dist/server/stream.js): https://html.spec.whatwg.org/multipage/semantics.html#charset
const HEAD_OPEN = /<head(?:\s[^>]*)?>/i;
const CHARSET = /<meta charset="[^"]*"\s*\/?>/i;
const VIEWPORT = /<meta name="viewport"[^>]*>/;
const STYLESHEET = /<link rel="stylesheet"/;

const endOf = (match: RegExpExecArray | null) =>
  match ? match.index + match[0].length : undefined;

function scriptPosition(head: string): number | undefined {
  const afterViewport = endOf(VIEWPORT.exec(head));
  const beforeStylesheets = STYLESHEET.exec(head)?.index;
  if (afterViewport === undefined) return beforeStylesheets;
  if (beforeStylesheets === undefined) return afterViewport;
  return Math.min(afterViewport, beforeStylesheets);
}

type ByteRange = readonly [start: number, end: number];

interface Order {
  first: ByteRange[];
  rest: ByteRange[];
}

function charsetFirst(head: string): Order {
  const opened = endOf(HEAD_OPEN.exec(head));
  const charset = CHARSET.exec(head);
  if (opened === undefined || !charset || charset.index < opened) {
    return { first: [], rest: [[0, head.length]] };
  }
  const closed = charset.index + charset[0].length;
  return {
    first: [
      [0, opened],
      [charset.index, closed]
    ],
    rest: [
      [opened, charset.index],
      [closed, head.length]
    ]
  };
}

function arranged(view: string, head: Uint8Array, tag: Uint8Array): Uint8Array {
  const at = scriptPosition(view);
  const { first, rest } = charsetFirst(view);
  const pieces = first.map(([start, end]) => head.subarray(start, end));
  let placed = at === undefined;
  for (const [start, end] of rest) {
    if (!placed && start <= at! && at! <= end) {
      pieces.push(head.subarray(start, at), tag, head.subarray(at, end));
      placed = true;
    } else {
      pieces.push(head.subarray(start, end));
    }
  }
  return concat(pieces);
}

const isArrangeable = (view: string) => scriptPosition(view) !== undefined && CHARSET.test(view);

const HEAD_SEARCH_BYTES = 16_384;

// A single-byte decoding gives one code unit per byte, so a match's index is its byte offset:
// https://encoding.spec.whatwg.org/#single-byte-decoder
const byteOffsets = new TextDecoder("windows-1252");

function concat(chunks: readonly Uint8Array[]): Uint8Array {
  const out = new Uint8Array(chunks.reduce((length, chunk) => length + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

export function withHeadScript(response: Response, script: string): Response {
  const type = response.headers.get("content-type") ?? "";
  if (!response.body || !type.startsWith("text/html")) return response;

  // Redact 0.3 hydrates head scripts by `src` and `type` alone (`HEAD_KEY_ATTRS`): the type keeps
  // the shell's untyped scripts from claiming this one.
  const tag = new TextEncoder().encode(`<script type="text/javascript">${script}</script>`);
  const held: Uint8Array[] = [];
  let heldBytes = "";
  let placed = false;
  const body = response.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        if (placed) return controller.enqueue(chunk);
        held.push(chunk);
        heldBytes += byteOffsets.decode(chunk);
        if (!isArrangeable(heldBytes) && heldBytes.length < HEAD_SEARCH_BYTES) return;
        placed = true;
        controller.enqueue(arranged(heldBytes, concat(held), tag));
      },
      flush(controller) {
        if (!placed) controller.enqueue(arranged(heldBytes, concat(held), tag));
      }
    })
  );
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(body, { status: response.status, statusText: response.statusText, headers });
}
