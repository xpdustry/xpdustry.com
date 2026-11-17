import { describe, expect, test } from "vitest";
import { withHeadScript } from "./headScript";

const page = (...chunks: string[]) =>
  new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
        controller.close();
      }
    }),
    { status: 404, headers: { "content-type": "text/html; charset=utf-8", "content-length": "9" } }
  );

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
