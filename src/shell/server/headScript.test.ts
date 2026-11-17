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

describe("withHeadScript", () => {
  test("puts the script after the viewport, ahead of the stylesheets", async () => {
    const response = withHeadScript(page(`${HEAD}<link rel="stylesheet" href="a.css"/>`), "go()");
    expect(await response.text()).toBe(
      `${HEAD}<script type="text/javascript">go()</script><link rel="stylesheet" href="a.css"/>`
    );
    expect(response.status).toBe(404);
    expect(response.headers.has("content-length")).toBe(false);
  });

  test("puts the script before stylesheets that come ahead of the viewport", async () => {
    const sheets =
      '<html><head><link rel="preload" href="a.woff2"/><link rel="stylesheet" href="a.css"/>';
    const response = withHeadScript(page(`${sheets}<meta name="viewport" content="x"/>`), "go()");
    expect(await response.text()).toBe(
      '<html><head><link rel="preload" href="a.woff2"/><script type="text/javascript">go()</script><link rel="stylesheet" href="a.css"/><meta name="viewport" content="x"/>'
    );
  });

  test("finds a viewport cut across chunks, and passes the rest of the page through", async () => {
    const response = withHeadScript(
      page(HEAD.slice(0, 60), `${HEAD.slice(60)}<title>é</title>`, "</head><body>ü</body>"),
      "go()"
    );
    expect(await response.text()).toBe(
      `${HEAD}<script type="text/javascript">go()</script><title>é</title></head><body>ü</body>`
    );
  });

  test.each([
    ["two", "é"],
    ["three", "€"],
    ["four", "🌍"]
  ])("keeps a %s byte character whole wherever a chunk boundary cuts it", async (_, character) => {
    const head = `<html><head><title>${character}</title><meta name="viewport" content="x"/>`;
    const rest = `${character}<title>${character}</title></head><body>${character}</body>`;
    const bytes = utf8(head + rest);
    const expected = utf8(`${head}<script type="text/javascript">go()</script>${rest}`);
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
      new Uint8Array([
        0xef,
        0xbb,
        0xbf,
        ...head,
        ...utf8('<script type="text/javascript">go()</script>'),
        0xc3,
        0x28
      ])
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

  test("moves a charset declaration that follows the viewport ahead of the script", async () => {
    const head =
      '<html><head><meta name="viewport" content="x"/><meta charset="utf-8"/><link rel="stylesheet" href="a.css"/>';
    const text = await withHeadScript(page(head), "go()").text();
    expect(text).toBe(
      '<html><head><meta charset="utf-8"/><meta name="viewport" content="x"/><script type="text/javascript">go()</script><link rel="stylesheet" href="a.css"/>'
    );
  });

  test("waits for a charset declaration in a later chunk before placing the script", async () => {
    const response = withHeadScript(
      page('<html><head><link rel="stylesheet" href="a.css"/>', '<meta charset="utf-8"/></head>'),
      "go()"
    );
    expect(await response.text()).toBe(
      '<html><head><meta charset="utf-8"/><script type="text/javascript">go()</script><link rel="stylesheet" href="a.css"/></head>'
    );
  });

  test("places the script once", async () => {
    const text = await withHeadScript(page(HEAD, HEAD), "go()").text();
    expect(text.split('<script type="text/javascript">go()</script>')).toHaveLength(2);
  });

  test("leaves a page without a viewport as it is", async () => {
    const response = withHeadScript(page("<html><head></head>", "<body></body></html>"), "go()");
    expect(await response.text()).toBe("<html><head></head><body></body></html>");
  });

  test("leaves what is not a page alone", () => {
    const feed = new Response("<rss/>", { headers: { "content-type": "application/xml" } });
    expect(withHeadScript(feed, "go()")).toBe(feed);
    const redirect = new Response(null, { status: 301, headers: { "content-type": "text/html" } });
    expect(withHeadScript(redirect, "go()")).toBe(redirect);
  });
});
