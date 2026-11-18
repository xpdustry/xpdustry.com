import { defineConfig, devices } from "playwright/test";
import { BROWSERS_WITH_OPEN_CLIPBOARD } from "#tests/support/browsers.ts";

const ci = Boolean(process.env.CI);

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/serve.setup.ts",
  fullyParallel: true,
  forbidOnly: ci,
  reporter: ci ? [["list"], ["junit", { outputFile: "reports/e2e.xml" }]] : "list",
  use: {
    baseURL: process.env.XPD_TEST_ORIGIN,
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...BROWSERS_WITH_OPEN_CLIPBOARD.chromium.context,
        launchOptions: BROWSERS_WITH_OPEN_CLIPBOARD.chromium.launch
      }
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        ...BROWSERS_WITH_OPEN_CLIPBOARD.firefox.context,
        launchOptions: BROWSERS_WITH_OPEN_CLIPBOARD.firefox.launch
      },
      testMatch: [
        "accessibility.test.ts",
        "entrance.test.ts",
        "fit.test.ts",
        "spread.test.ts",
        "team.test.ts",
        "tray-outline.test.ts"
      ]
    }
  ]
});
