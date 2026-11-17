import { expect, test } from "#tests/support/test.ts";

const PAGES = ["/", "/fr", "/ru", "/blog", "/fr/blog", "/blog/nohorny-4-beta-8"];

declare global {
  interface Window {
    sentByServer?: Element[];
  }
}

for (const path of PAGES) {
  test(`${path} keeps the elements the server sent`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        window.sentByServer = [...document.querySelectorAll("body *")];
      });
    });
    await page.goto(path);
    await page.waitForFunction(() => "hydrated" in document.documentElement.dataset);

    const kept = await page.evaluate(() => {
      const sent = window.sentByServer ?? [];
      const now = new Set(document.querySelectorAll("body *"));
      return {
        sent: sent.length,
        lost: sent.filter((element) => !now.has(element)).length,
        made: [...now].filter((element) => !sent.includes(element)).length
      };
    });

    expect(errors).toEqual([]);
    expect(kept.sent).toBeGreaterThan(100);
    expect(kept, "the page was built again in the browser").toMatchObject({ lost: 0, made: 0 });
  });
}
