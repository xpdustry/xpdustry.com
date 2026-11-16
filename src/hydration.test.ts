import { chromium, type Browser } from "playwright";
import { afterAll, beforeAll, expect, test } from "vitest";
import { startProductionServer } from "./testServer";

/**
 * A page is hydrated in place: the elements the server sent are the ones the visitor keeps.
 *
 * A renderer that finds the first render in the browser unlike the server's markup may throw that
 * markup away and build the page again. Nothing reports it, and the page looks the same once it
 * is done, but whatever was already running on the server's elements is gone, as the entrance of
 * the textures is, and the work of drawing the page is done twice.
 */
let browser: Browser;
let origin: string;
let stop: () => Promise<void>;

beforeAll(async () => {
  ({ origin, stop } = await startProductionServer());
  browser = await chromium.launch();
});

afterAll(async () => {
  await browser?.close();
  await stop?.();
});

const PAGES = ["/", "/fr", "/ru", "/blog", "/fr/blog", "/blog/nohorny-4-beta-8"];

test.each(PAGES)("%s keeps the server's elements", async (path) => {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // Every element is noted as the document finishes parsing, before the page's scripts run.
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      (window as { sent?: Element[] }).sent = [...document.querySelectorAll("body *")];
    });
  });
  await page.goto(origin + path);
  await page.waitForFunction(() => "hydrated" in document.documentElement.dataset);

  const kept = await page.evaluate(() => {
    const sent = (window as { sent?: Element[] }).sent ?? [];
    const now = new Set(document.querySelectorAll("body *"));
    return {
      sent: sent.length,
      lost: sent.filter((element) => !now.has(element)).length,
      made: [...now].filter((element) => !sent.includes(element)).length
    };
  });
  await page.close();

  expect(errors).toEqual([]);
  expect(kept.sent).toBeGreaterThan(100);
  expect(kept, "the page was built again in the browser").toMatchObject({ lost: 0, made: 0 });
});
