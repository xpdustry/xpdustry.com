import { describe, expect, test } from "vitest";
import { withHeadScript } from "./headScript";

const pageOfBytes = (...chunks: Uint8Array[]) =>
  new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk);
        controller.close();
      }
    }),
    { status: 404, headers: { "content-type": "text/html; charset=utf-8", "content-length": "9" } }
  );

const utf8 = (text: string) => new TextEncoder().encode(text);
const page = (...chunks: string[]) => pageOfBytes(...chunks.map(utf8));

const HEAD =
  '<!DOCTYPE html><html><head><meta charSet="utf-8"/><meta name="viewport" content="x"/>';
const SCRIPT = '<script type="text/javascript">go()</script>';

describe("withHeadScript", () => {
  const VIEWPORT = '<meta name="viewport" content="x"/>';
  const SHEET = '<link rel="stylesheet" href="a.css"/>';
  const CHARSET = '<meta charset="utf-8"/>';

  test.each([
    [
      "after the viewport, ahead of the stylesheets",
      [`${HEAD}${SHEET}`],
      `${HEAD}${SCRIPT}${SHEET}`
    ],
    [
      "before stylesheets that come ahead of the viewport",
      [`<head><link rel="preload" href="a.woff2"/>${SHEET}${VIEWPORT}`],
      `<head><link rel="preload" href="a.woff2"/>${SCRIPT}${SHEET}${VIEWPORT}`
    ],
    [
      "after a viewport cut across chunks, passing the rest of the page through",
      [HEAD.slice(0, 60), `${HEAD.slice(60)}<title>é</title>`, "</head><body>ü</body>"],
      `${HEAD}${SCRIPT}<title>é</title></head><body>ü</body>`
    ],
    [
      "behind a charset declaration it moves ahead of the viewport",
      [`<head>${VIEWPORT}${CHARSET}${SHEET}`],
      `<head>${CHARSET}${VIEWPORT}${SCRIPT}${SHEET}`
    ],
    [
      "once a charset declaration in a later chunk has come",
      [`<head>${SHEET}`, `${CHARSET}</head>`],
      `<head>${CHARSET}${SCRIPT}${SHEET}</head>`
    ],
    [
      "nowhere in a page without a viewport",
      ["<head></head>", "<body></body>"],
      "<head></head><body></body>"
    ]
  ])("puts the script %s", async (_label, chunks, expected) => {
    const response = withHeadScript(page(...chunks), "go()");
    expect(await response.text()).toBe(expected);
    expect(response.status).toBe(404);
    expect(response.headers.has("content-length")).toBe(false);
  });

  test.each([
    ["two", "é"],
    ["three", "€"],
    ["four", "🌍"]
  ])("keeps a %s byte character whole wherever a chunk boundary cuts it", async (_, character) => {
    const head = `<html><head><title>${character}</title><meta name="viewport" content="x"/>`;
    const rest = `${character}<title>${character}</title></head><body>${character}</body>`;
    const bytes = utf8(head + rest);
    const expected = utf8(`${head}${SCRIPT}${rest}`);
    for (let cut = 1; cut < bytes.length; cut++) {
      const response = withHeadScript(pageOfBytes(bytes.slice(0, cut), bytes.slice(cut)), "go()");
      expect(new Uint8Array(await response.arrayBuffer()), `cut at byte ${cut}`).toEqual(expected);
    }
  });

  test("passes a byte order mark and bytes that are not UTF-8 through untouched", async () => {
    const head = utf8('<html><head><meta name="viewport" content="x"/>');
    const response = withHeadScript(
      pageOfBytes(new Uint8Array([0xef, 0xbb, 0xbf]), head, new Uint8Array([0xc3, 0x28])),
      "go()"
    );
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(
      new Uint8Array([0xef, 0xbb, 0xbf, ...head, ...utf8(SCRIPT), 0xc3, 0x28])
    );
  });

  test("moves the charset declaration first, where Redact's hints and the title came ahead of it", async () => {
    const charset = '<meta charset="utf-8"/>';
    const fonts = '<link rel="preload" href="/assets/font.woff2" as="font"/>'.repeat(6);
    const sheets = '<link rel="stylesheet" href="/assets/a.css"/>'.repeat(6);
    const redactOrder = `<!DOCTYPE html><html lang="en"><head>${fonts}${sheets}<style>x</style><title>Xpdustry</title>${charset}<meta name="viewport" content="x"/>`;

    const text = await withHeadScript(
      page(`${redactOrder}</head><body>é</body>`),
      "go();".repeat(500)
    ).text();

    expect(text).toBe(
      `<!DOCTYPE html><html lang="en"><head>${charset}${fonts}<script type="text/javascript">${"go();".repeat(500)}</script>${sheets}<style>x</style><title>Xpdustry</title><meta name="viewport" content="x"/></head><body>é</body>`
    );
    expect(
      Buffer.byteLength(text.slice(0, text.indexOf(charset) + charset.length))
    ).toBeLessThanOrEqual(1024);
  });

  test("leaves what is not a page alone", () => {
    const feed = new Response("<rss/>", { headers: { "content-type": "application/xml" } });
    expect(withHeadScript(feed, "go()")).toBe(feed);
    const redirect = new Response(null, { status: 301, headers: { "content-type": "text/html" } });
    expect(withHeadScript(redirect, "go()")).toBe(redirect);
  });
});
