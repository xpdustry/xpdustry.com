import type { Page } from "playwright/test";

const INSTALLED_AT = new Date("2026-01-01T12:00:00Z").getTime();
/** Far enough ahead that installing on a loaded machine never overtakes it. */
const PAUSED_AT = INSTALLED_AT + 60 * 60 * 1000;

/** Stops the page's timers until the test runs them, before the page has scheduled any. */
export async function holdTheClock(page: Page) {
  await page.clock.install({ time: INSTALLED_AT });
  await page.clock.pauseAt(PAUSED_AT);
}
